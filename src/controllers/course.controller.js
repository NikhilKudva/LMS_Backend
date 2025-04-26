import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { prisma } from "../database/db.js";

/**
 * Create a new course
 * @route POST /api/v1/courses
 */
export const createNewCourse = catchAsync(async (req, res) => {
  const { title, subtitle, description, category, level, price } = req.body;

  let thumbnail;
  if (req.file) {
    const result = await uploadMedia(req.file.path);
    thumbnail = result?.secure_url || req.file.path;
  } else {
    throw new AppError("Course thumbnail is required", 400);
  }

  const course = await prisma.course.create({
    data: {
      title,
      subtitle,
      description,
      category,
      level,
      price,
      thumbnail,
      instructorId: req.id,
    },
  });

  await prisma.user.update({
    where: { id: req.id },
    data: {
      createdCourses: { connect: { id: course.id } },
    },
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

/**
 * Search courses with filters
 * @route GET /api/v1/courses/search
 */
export const searchCourses = catchAsync(async (req, res) => {
  const {
    query = "",
    categories = [],
    level,
    priceRange,
    sortBy = "newest",
  } = req.query;

  // Create search query
  const searchCriteria = {
    isPublished: true,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { subtitle: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  };

  // Apply filters
  if (categories.length > 0) {
    searchCriteria.category = { $in: categories };
  }
  if (level) {
    searchCriteria.level = level;
  }
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    searchCriteria.price = { $gte: min || 0, $lte: max || Infinity };
  }

  // Define sorting
  const sortOptions = {};
  switch (sortBy) {
    case "price-low":
      sortOptions.price = 1;
      break;
    case "price-high":
      sortOptions.price = -1;
      break;
    case "oldest":
      sortOptions.createdAt = 1;
      break;
    default:
      sortOptions.createdAt = -1;
  }

  const courses = await prisma.course.findMany({
    where: searchCriteria,
    orderBy: sortOptions,
  });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

/**
 * Get all published courses
 * @route GET /api/v1/courses/published
 */
export const getPublishedCourses = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
  const total = await prisma.course.count({ where: { isPublished: true } });


  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
 */
export const getMyCreatedCourses = catchAsync(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { instructorId: req.id },
  });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

/**
 * Update course details
 * @route PATCH /api/v1/courses/:courseId
 */
export const updateCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, subtitle, description, category, level, price } = req.body;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  // Verify ownership
  if (course.instructorId !== req.id) {
    throw new AppError("Not authorized to update this course", 403);
  }

  // Handle thumbnail upload
  let thumbnail;
  if (req.file) {
    if (course.thumbnail) {
      await deleteMediaFromCloudinary(course.thumbnail);
    }
    const result = await uploadMedia(req.file.path);
    thumbnail = result?.secure_url || req.file.path;
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      title,
      subtitle,
      description,
      category,
      level,
      price,
      ...(thumbnail && { thumbnail }),
    },
  });

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: updatedCourse,
  });
});

/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.courseId },
    include: {
      instructor: true,
      lectures: true,
    },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      ...course.toJSON(),
      averageRating: course.averageRating,
    },
  });
});

/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourse = catchAsync(async (req, res) => {
  const { title, description, isPreview } = req.body;
  const { courseId } = req.params;

  // Get course and verify ownership
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  if (course.instructorId !== req.id) {
    throw new AppError("Not authorized to update this course", 403);
  }

  // Handle video upload
  if (!req.file) {
    throw new AppError("Video file is required", 400);
  }

  // Upload video to cloudinary
  const result = await uploadMedia(req.file.path);
  if (!result) {
    throw new AppError("Error uploading video", 500);
  }

  // Create lecture with video details from cloudinary
  const lecture = await prisma.lecture.create({
    data: {
      title,
      description,
      isPreview,
      order: course.lectures.length + 1,
      videoUrl: result?.secure_url || req.file.path,
      publicId: result?.public_id || req.file.path,
      duration: result?.duration || 0, // Cloudinary provides duration for video files
    },
  });

  // Add lecture to course
  await prisma.course.update({
    where: { id: courseId },
    data: { lectures: { connect: { id: lecture.id } } },
  });

  res.status(201).json({
    success: true,
    message: "Lecture added successfully",
    data: lecture,
  });
});

/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.courseId },
    include: {
      lectures: true,
    },
  });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Check if user has access to full course content
  const isEnrolled = course.enrolledStudents.includes(req.id);
  const isInstructor = course.instructorId === req.id;

  let lectures = course.lectures;
  if (!isEnrolled && !isInstructor) {
    // Only return preview lectures for non-enrolled users
    lectures = lectures.filter((lecture) => lecture.isPreview);
  }

  res.status(200).json({
    success: true,
    data: {
      lectures,
      isEnrolled,
      isInstructor,
    },
  });
});