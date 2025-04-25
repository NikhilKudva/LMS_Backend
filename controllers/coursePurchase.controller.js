import Stripe from "stripe";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import prisma from "../database/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const initiateStripeCheckout = catchAsync(async (req, res) => {
  const { courseId } = req.body;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const newPurchase = await prisma.coursePurchase.create({
    data: {
      courseId: courseId,
      userId: req.id,
      amount: course.price,
      status: "pending",
      paymentMethod: "stripe",
    },  
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: course.title,
            images: [],
          },
          unit_amount: course.price * 100,
          },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CORS_ORIGIN}/course-progress/${courseId}`,
    cancel_url: `${process.env.CORS_ORIGIN}/course-detail/${courseId}`,
    metadata: {
      courseId: courseId,
      userId: req.id,
    },
    shipping_address_collection: {
      allowed_countries: ["IN"],
    },
  });

  if (!session.url) {
    throw new AppError("Failed to create checkout session", 400);
  }

  newPurchase.paymentId = session.id;
  await newPurchase.save();

  res.status(200).json({
    success: true,
    data: {
      checkoutUrl: session.url,
    },
  });
});

export const handleStripeWebhook = catchAsync(async (req, res) => {
  let event;

  try {
    const payloadString = JSON.stringify(req.body, null, 2);
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    event = stripe.webhooks.constructEvent(payloadString, header, secret);
  } catch (error) {
    throw new AppError(`Webhook Error: ${error.message}`, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const purchase = await CoursePurchase.findOne({
      paymentId: session.id,
    }).populate("course");

    if (!purchase) {
      throw new AppError("Purchase record not found", 404);
    }

    purchase.amount = session.amount_total
      ? session.amount_total / 100
      : purchase.amount;
    purchase.status = "completed";
    await purchase.save();

    if (purchase.course?.lectures?.length > 0) {
      await prisma.lecture.updateMany({
        where: { id: { in: purchase.course.lectures } },
        data: { isPreviewFree: true },
      });
    }

    await prisma.user.update({
      where: { id: purchase.user._id },
      data: { enrolledCourses: { connect: { id: purchase.course._id } } },
    });

    await prisma.course.update({
      where: { id: purchase.course._id },
      data: { enrolledStudents: { connect: { id: purchase.user._id } } },
    });
  }

  res.status(200).json({ received: true });
});

export const getCoursePurchaseStatus = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: true,
      lectures: true,
    },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const purchased = await prisma.coursePurchase.exists({
    where: {
      userId: req.id,
      courseId: courseId,
      status: "completed",
    },
  });

  res.status(200).json({
    success: true,
    data: {
      course,
      isPurchased: Boolean(purchased),
    },
  });
});

export const getPurchasedCourses = catchAsync(async (req, res) => {
  const purchases = await prisma.coursePurchase.findMany({
    where: {
      userId: req.id,
      status: "completed",
    },
    include: {
      course: {
        include: {
          creator: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: purchases.map((purchase) => purchase.courseId),
  });
});