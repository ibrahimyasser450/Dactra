import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.status(200).json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(
      "error at changeAvailability function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(
      "error at doctorList function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      res.status(400).json({ success: false, message: "Doctor is not found" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });
      res.status(200).json({ success: true, token });
    } else {
      res.status(400).json({ success: false, message: "password is wrong" });
    }
  } catch (error) {
    console.log(
      "error at loginDoctor function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor Appointments for doctor panal
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.doctor.id;
    const appointments = await appointmentModel
      .find({ docId })
      .populate("userId", "-password")
      .populate("docId", "-password")
      .sort({ date: -1 }); // Sort by date[created date] descending order
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.log(
      "error at appointmentsDoctor function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for doctor panal
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctor.id;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (
      appointmentData &&
      appointmentData.docId.toString() === docId.toString()
    ) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      res.status(200).json({ success: true, message: "Appointment Completed" });
    } else {
      res.status(400).json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(
      "error at appointmentComplete function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panal
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctor.id;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (
      appointmentData &&
      appointmentData.docId.toString() === docId.toString()
    ) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      res.status(200).json({ success: true, message: "Appointment Cancelled" });
    } else {
      res.status(400).json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(
      "error at appointmentCancel function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panal
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.doctor.id;
    const appointments = await appointmentModel
      .find({ docId })
      .populate("userId", "-password");
    let earnings = 0;
    appointments.map((item) => {
      if (item.isCompleted && item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashDataDoctor = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };
    res.status(200).json({ success: true, dashDataDoctor });
  } catch (error) {
    console.log(
      "error at doctorDashboard function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for Doctor Panal
const doctorProfile = async (req, res) => {
  try {
    const docId = req.doctor.id;
    const profileData = await doctorModel.findById(docId).select("-password");
    res.status(200).json({ success: true, profileData });
  } catch (error) {
    console.log(
      "error at doctorProfile function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};

//API to update doctor profile data from Doctor Panal
const updateDoctorProfile = async (req, res) => {
  try {
    const { fees, address, available } = req.body;
    const docId = req.doctor.id;
    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
    res.status(200).json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(
      "error at updateDoctorProfile function at doctorController at backend:",
      error,
    );
    res.json({ success: false, message: error.message });
  }
};
export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};
