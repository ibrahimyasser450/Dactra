import validator from "validator";
import bycrypt from "bcrypt";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import JWT from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    // validating strong password
    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
      });
    }

    //hashing doctor password
    const hashedPassword = await bycrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    // saving user object to database
    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    return res
      .status(201)
      .json({ success: true, message: "User added successfully", token });
  } catch (error) {
    console.log(
      "error at registerUser function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

//API to login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bycrypt.compare(password, user.password);

    if (isMatch) {
      const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });
      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        token,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(
      "error at loginUser function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

//API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = await userModel.findById(userId).select("-password");
    return res.status(200).json({ success: true, userData });
  } catch (error) {
    console.log(
      "error at getProfile function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

//API to update user profile data
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !address || !dob || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Find user
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user data
    user.name = name;
    user.phone = phone;
    user.address = JSON.parse(address);
    user.dob = dob;
    user.gender = gender;

    // Update image if a new one was uploaded
    if (imageFile) {
      // Delete old image from Cloudinary (if it exists)
      if (user.imagePublicId) {
        await cloudinary.uploader.destroy(user.imagePublicId);
      }

      // Upload new image
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        folder: "users",
        resource_type: "image",
      });

      // Save new image data
      user.image = imageUpload.secure_url;
      user.imagePublicId = imageUpload.public_id;
    }

    // Save all changes
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log(
      "error at updateProfile function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.user.id;
    // Fetch doctor data from the database
    const doctorData = await doctorModel.findById(docId).select("-password");

    if (!doctorData.available) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not available",
      });
    }

    let slots_booked = doctorData.slots_booked;

    //cheching for slot availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.status(400).json({
          success: false,
          message: "Slot is already booked",
        });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    delete doctorData.slots_booked; // Remove slots_booked from doctorData before saving to appointment
    // Create a new appointment
    const appointment = new appointmentModel({
      userId,
      docId,
      slotDate,
      slotTime,
      amount: doctorData.fees,
      date: Date.now(),
    });

    await appointment.save();

    // Update the doctor's slots_booked in the database
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.status(200).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.log(
      "error at bookAppointment function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for my-appointments page
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await appointmentModel
      .find({ userId })
      .populate("docId", "-password")
      .sort({ date: -1 }); // Sort by date[created date] descending order
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(
      "error at getUserAppointments function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user.id;

    const appointmentData = await appointmentModel
      .findOne({
        _id: appointmentId,
        userId,
      })
      .populate("docId", "-password");

    if (!appointmentData) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;
    let slots_booked = docId.slots_booked;

    // Remove the cancelled slot from the doctor's slots_booked
    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (time) => time !== slotTime,
      );
    }
    // Update the doctor's slots_booked in the database
    await doctorModel.findByIdAndUpdate(docId._id, { slots_booked });

    return res.status(200).json({
      success: true,
      message: "Appointment canceled successfully",
    });
  } catch (error) {
    console.log(
      "error at cancelAppointment function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to make payment for an appointment using Stripe
const makePaymentSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .populate("userId", "-password")
      .populate("docId", "-password");
    if (!appointmentData || appointmentData.cancelled) {
      return res.status(404).json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // for credit card
      mode: "payment",
      // credit card has been successfully charged[paid] and the purchase is successful and the user is redirected to success page[this link]
      success_url: `${process.env.FRONTEND_URL}/my-appointments/?sessionId={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      // the user is redirected to cancel page[this link] if he cancels the payment
      cancel_url: `${process.env.FRONTEND_URL}/my-appointments`,
      customer_email: appointmentData.userId.email,
      client_reference_id: appointmentId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${appointmentData.docId.name}'s appointment`,
              description: "Doctor Appointment",
              images: [appointmentData.docId.image],
            },
            unit_amount: appointmentData.amount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.log(
      "error at makePaymentSession function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { sessionId, appointmentId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // console.log("session", session);
    if (session.payment_status === "paid") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });

      return res.status(200).json({
        success: true,
        message: "Payment successful",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment failed",
      });
    }
  } catch (error) {
    console.log(
      "error at verifyPayment function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  getUserAppointments,
  cancelAppointment,
  makePaymentSession,
  verifyPayment,
};
