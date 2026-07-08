import validator from "validator";
import bycrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";
import JWT from "jsonwebtoken";
// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialty,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;
    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !specialty ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
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

    // uploading doctor image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      folder: "doctors",
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    // creating doctor object to save in database
    const doctor = {
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      specialty,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address), // converting address string to object
      date: Date.now(),
    };
    // saving doctor object to database
    await doctorModel.create(doctor);
    return res
      .status(201)
      .json({ success: true, message: "Doctor added successfully" });
  } catch (error) {
    console.log(
      "error at adminController at backend at addDoctor function:",
      error,
    );
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API for admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // checking for email and password
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = JWT.sign({ email }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });
      return res.status(200).json({
        success: true,
        message: "Admin logged in successfully",
        token,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(
      "error at adminController at backend at loginAdmin function:",
      error,
    );
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panal
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(
      "error at adminController at backend for allDoctors function:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list for admin panal
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({})
      .populate("docId", "-password")
      .populate("userId", "-password");
    res.json({ seccess: true, appointments });
  } catch (error) {
    console.log(
      "error at adminController at backend for appointmentsAdmin function:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API Admin make cancellation for appointment
const adminCancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel
      .findOne({
        _id: appointmentId,
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

//API to get dashboard data for admin panal
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel
      .find({})
      .populate("docId", "-password");

    const dashboardData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    return res.status(200).json({
      success: true,
      dashboardData,
    });
  } catch (error) {
    console.log(
      "error at adminDashboard function at userController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};
export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  adminCancelAppointment,
  adminDashboard,
};
