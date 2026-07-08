import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Successfully Connected ✅");
    });

    await mongoose.connect(process.env.MONGODB_URL);
  } catch (error) {
    console.error(error);
  }
};

export default connectDB;