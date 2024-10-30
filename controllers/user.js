import catchAsyncError from '../middlewares/catchAsyncError.js';
import UserModel from '../models/user.js'; 
import sendResponse from '../utils/sendResponse.js';
import {sendToken} from '../utils/sendToken.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import getDataUri from '../utils/dataUri.js';
import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });
import Stripe from "stripe"
import { User } from 'lucide-react';

const stripe = Stripe(process.env.STRIPE_KEY);
const __dirname = dirname(fileURLToPath(import.meta.url))

export const register = catchAsyncError(async (req, res) => {
	const {name, email, password,role} = req.body;
	console.log('body',req.body);
	const isExist = await UserModel.findOne({email});
	if(isExist) return sendResponse(false, 401, 'Email already exist',res);
	if(!name, !email, !password){
		return sendResponse(false, 401, 'All fields are required',res);
	}

	if(req.file){
		const base64 = getDataUri(req.file);
		const filename = `${new Date(Date.now()).getTime()}-${req.file.originalname}${base64.fileName}`
	    fs.writeFileSync(path.join(__dirname,`../public/upload/images/${filename}`),base64.buffer,'binary');
		req.body.avatar = `/upload/images/${filename}`;
	}else{
		req.body.avatar = `/upload/images/default.jpg`
	}
	console.log('1')
	const user = await UserModel.create({
		name: name,
		email: email,
		password: password,
		avatar: req.body.avatar,
	});
	console.log('2')
	user.save();

	sendToken(res, user, "resgister Successfully", 201);
});


export const login = catchAsyncError(async (req, res, next) => {
	console.log('login')
	const {email, password} = req.body;
	console.log(email,password)
	if(!email || !password) return sendResponse(false, 401, 'All fields are required',res);
	let user = await UserModel.findOne({email});

	if (!user)
      return sendResponse(false, 401, 'Incorrect Email or Password',res);

	const isMatch = await user.comparePassword(password);
    if (!isMatch)
		return sendResponse(false, 401, 'Incorrect Email or Password',res);
	
	sendToken(res, user, "login Successfully", 201);
	
	

});

export const getallUsers=catchAsyncError(async(req,res,next)=>{
	
	const user =await UserModel.find();
	res.status(200).json({
		success: true,
		users: user
	})
})

export const checkOTP = catchAsyncError(async (req, res, next) => {
	console.log('login')
	const {OTP} = req.body;
	console.log(req.body)

	const user = await UserModel.findOne({OTP,OTPExpire: {$gt: Date.now()}});


	if (!user)
      return next(new ErrorHandler("OTP is invalid or has been expired", 401));
  
    user.OTP = undefined;
    user.OTPExpire = undefined;
    await user.save();
	
    sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

export const loadme = catchAsyncError(async (req, res, next) => {
	console.log('loodme')
	res.status(200).json({
		success: true,
		user: req.user
	})
	console.log('uuuuu')
});

export const logout = catchAsyncError(async (req, res, next) => {
	res.clearCookie('token').status(200).json({
		success: true,
		message: 'Logout successfully'
	})
});

export const increaseLimit=async(req,res,next)=>{
	
	let {incLimit,userId}=req.body
	console.log("ub crease kunut")
	incLimit=Number(incLimit)
	await UserModel.updateOne({"_id":userId},{ $inc: { limit: incLimit} }  )
	res.status(200).json({sucess:true });


}
export const updateUser = catchAsyncError(async (req, res, next) => {
	const {name, email,file} = req.body;
	
	if(req.file){
		const base64 = getDataUri(req.file);
		const filename = `${new Date(Date.now()).getTime()}-${req.file.originalname}${base64.fileName}`
	    fs.writeFileSync(path.join(__dirname,`../public/upload/images/${filename}`),base64.buffer,'binary');
		const avatar = `/upload/images/${filename}`;
		console.log(avatar)
		const user = await UserModel.findByIdAndUpdate(req.user._id,{name,email,avatar});
	}
	const user = await UserModel.findByIdAndUpdate(req.user._id,{name,email});
	
	sendResponse(true,200,'Update successfully',res);
});

export const changePassword = catchAsyncError(async (req, res, next) => {
	const {oldpassword, newpassword} = req.body;
	const user = await UserModel.findById(req.user._id);
	
	const isMatch = await user.comparePassword(oldpassword);
    if (!isMatch)
		return sendResponse(false, 401, 'Incorrect old password',res);
	
	user.password = newpassword;
	await user.save();
  
    sendResponse(true,200,'Password update successfully',res);
});


// forgot password 
export const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;
    // console.log(email)

    const user = await UserModel.findOne({ email });

    if (!user) return next(new ErrorHandler("User not found", 400));

    const resetToken = await user.getResetToken();

    await user.save();

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `Click on the link to reset your password. ${url}. If you have not request then please ignore.`;
    // Send token via email
    await sendEmail(user.email, "HG Streaming Reset Password", message);
	console.log(url);
	sendResponse(true,200,`Reset Token has been sent to ${user.email}`,res);
  });

export const update_subscription=catchAsyncError(async (req, res, next) => {
		const currentDate = new Date();
		console.log("in it")
		const { session_id } = req.body;
		console.log(session_id)
		
		try {
		  const session = await stripe.checkout.sessions.retrieve(session_id);
		  const expirationDate = new Date(currentDate.setDate(currentDate.getDate() + 30)); // Add 30 days

		  if (session.payment_status === 'paid') {
			console.log("paid")
			console.log(req.user._id)
			await UserModel.updateOne(
				{ _id: req.user._id }, 
				{ $set: { 
					subscription_plan: 'basic',
				 payment_id: session_id,
				 payment_time:expirationDate
				} }
			);
			res.status(200).json({sucess:true, message: 'Payment successful', session });
			
		  } else {
			// Payment failed or still processing
			res.status(400).json({ message: 'Payment not completed' });
		  }
		} catch (error) {
			console.log(error)
		  res.status(500).json({sucess:false, error: error.message });
		}
	  
	
 
})
// reset password 
export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;
  console.log(token)
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  
    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });
  
    if (!user)
      return next(new ErrorHandler("Token is invalid or has been expired", 401));
	console.log(req.body)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
	sendResponse(true,200,"Password Changed Successfully",res);
  });

