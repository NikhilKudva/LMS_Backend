import { prisma } from "../database/db.js";
import { catchAsync } from "../middleware/error.middleware.js";

export const checkHealth = catchAsync(async (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'healthy',
        details: {
          provider: 'prisma',
          connected: true
        }
      },
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    healthStatus.services.database.status = 'unhealthy';
    healthStatus.services.database.details.connected = false;
    healthStatus.services.database.details.error = error.message;
    healthStatus.status = 'ERROR';
  }

  const httpStatus = healthStatus.status === 'OK' ? 200 : 503;
  res.status(httpStatus).json(healthStatus);
});