import prisma from "../database/db.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

export const getUserCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const courseDetails = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lectures: true,
    },
  });

  if (!courseDetails) {
    throw new AppError("Course not found", 404);
  }

  const courseProgress = await prisma.courseProgress.findUnique({
    where: { courseId, userId: req.id },
    include: { course: true },
  });

  if (!courseProgress) {
    return {
      success: true,
      data: {
        courseDetails,
        progress: [],
        isCompleted: false,
        completionPercentage: 0,
      },
    };
  }

  const totalLectures = courseDetails.lectures.length;
  const completedLectures = courseProgress.lectureProgress.filter(
    (lp) => lp.isCompleted
  ).length;
  const completionPercentage = Math.round(
    (completedLectures / totalLectures) * 100
  );

  return {
    success: true,
    data: {
      courseDetails,
      progress: courseProgress.lectureProgress,
      isCompleted: courseProgress.completed,
      completionPercentage,
    },
  };
});

export const updateLectureProgress = catchAsync(async (req, res) => {
  const { courseId, lectureId } = req.params;

  let courseProgress = await prisma.courseProgress.findUnique({
    where: { courseId, userId: req.id },
  });

  if (!courseProgress) {
    courseProgress = await prisma.courseProgress.create({
      data: {
        userId: req.id,
        courseId,
        isCompleted: false,
        lectureProgress: [],
      },
    });
  }

  const lectureIndex = courseProgress.lectureProgress.findIndex(
    (lecture) => lecture.lecture === lectureId
  );

  if (lectureIndex !== -1) {
    courseProgress.lectureProgress[lectureIndex].isCompleted = true;
  } else {
    courseProgress.lectureProgress.push({
      lecture: lectureId,
      isCompleted: true,
    });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  const completedLectures = courseProgress.lectureProgress.filter(
    (lp) => lp.isCompleted
  ).length;
  courseProgress.isCompleted = course.lectures.length === completedLectures;

  await courseProgress.save();

  return {
    success: true,
    message: "Lecture progress updated successfully",
    data: {
      lectureProgress: courseProgress.lectureProgress,
      isCompleted: courseProgress.isCompleted,
    },
  };
});

export const markCourseAsCompleted = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const courseProgress = await prisma.courseProgress.findUnique({
    where: { courseId, userId: req.id },
  });

  if (!courseProgress) {
    throw new AppError("Course progress not found", 404);
  }

  courseProgress.lectureProgress.forEach((progress) => {
    progress.isCompleted = true;
  });
  courseProgress.isCompleted = true;

  await courseProgress.save();

  return {
    success: true,
    message: "Course marked as completed",
    data: courseProgress,
  };
});

export const resetCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const courseProgress = await prisma.courseProgress.findUnique({
    where: { courseId, userId: req.id },
  });

  if (!courseProgress) {
    throw new AppError("Course progress not found", 404);
  }

  courseProgress.lectureProgress.forEach((progress) => {
    progress.isCompleted = false;
  });
  courseProgress.isCompleted = false;

  await courseProgress.save();

  res.status(200).json({
    success: true,
    message: "Course progress reset successfully",
    data: courseProgress,
  });
});