import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  getUserAppointments,
  cancelAppointment,
  makePaymentSession,
  verifyPayment,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";
const userRouter = express.Router();

userRouter.post("/signUp", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/my-profile", authUser, getProfile);
userRouter.put(
  "/update-profile",
  authUser,
  upload.single("image"),
  updateProfile,
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, getUserAppointments);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/create-payment-session", authUser, makePaymentSession);
userRouter.post("/verify-payment", authUser, verifyPayment);

export default userRouter;
