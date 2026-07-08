import express from "express";
import jwt from "jsonwebtoken";

// user authentication middleware
const authDoctor = (req, res, next) => {
  try {
    const dtoken = req.headers.authorization.split(" ")[1];
    if (!dtoken) {
      return res.status(401).json({ message: "Not Authorized Login Again" });
    }
    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET_KEY);
    req.doctor = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export default authDoctor;
