import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config({path:".env"});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  
};

export const verifyPayment = async (req, res) => {
  
};
