import express from "express";
import cors from "cors";
import http from "http";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import helmet from "helmet";
import compression from "compression";

// app config
const app = express();
const server = http.createServer(app); //create http server
const port = process.env.PORT || 3000;
connectDB();
connectCloudinary();
// middlewares
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  ,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

// set security HTTP headers
app.use(helmet());

// Compress all responses [compress all the text that we send to the client]
app.use(compression());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.use("/api/test", (req, res) => res.send("Server is working")); // just for test if backend work or not

if (process.env.NODE_ENV !== "production") {
  server.listen(port, () => console.log(`Server Started on ${port} 😋`));
}

// must when want to deploy at vercel
export default server;
