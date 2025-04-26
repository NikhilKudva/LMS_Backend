import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import razorpayRoute from "./routes/razorpay.routes.js";
import healthRoute from "./routes/health.routes.js";
import connectDB from "./database/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerOptions from "./utils/swagger.js";


dotenv.config({ path: ".env" });

await connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(helmet());
//protect against well-known web vulnerabilities by setting HTTP headers appropriately(xss, clickjacking, etc)
//xss: cross-site scripting attacks
//clickjacking: clicking on a link or button that takes you to a different site
app.use(hpp());
//prevent parameter pollution 
app.use("/api", limiter);

// Enable request logging in development mode
// Format: :method :url :status :response-time ms - :res[content-length]
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
//parse cookies from the request, as express doesn't parse cookies by default
//we parse cookies to get the user's session information
//we use the cookieParser middleware to parse the cookies

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, //allow cookies to be sent with the request
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], //allow all methods  
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  })
);
//allow cross-origin requests from the frontend
//we allow a specific origin to make requests to the backend

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/razorpay", razorpayRoute);
app.use("/health", healthRoute);
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

//global error handler
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),//only in development mode
  });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
});
