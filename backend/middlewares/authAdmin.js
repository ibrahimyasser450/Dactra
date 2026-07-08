import express from "express";
import jwt from "jsonwebtoken";

// admin authentication middleware
const authAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Not Authorized Login Again" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: "Not Authorized Login Again" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export default authAdmin;
