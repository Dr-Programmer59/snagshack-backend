import coupans from "../models/coupans.js";
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

import user from "../models/user.js";

export const sendcoupanEmail = catchAsyncError(async (req, res, next) => {
	
	if(req.user.limit>0){
		const unusedCoupan = await coupans.findOne({ used: false, coupanActivated: true });
		await coupans.updateOne({"_id":unusedCoupan._id},{ $set: { used: true }})
		await user.updateOne({"_id":req.user._id},{ $inc: { limit:-1 } } )
		res.status(200).json({
			success: true,
			coupan: unusedCoupan
		})
	}
	else{
		res.status(200).json({
			success: false,
			coupan: false
		})
	}
	
	
	
});

export const getOTP= catchAsyncError(async (req, res, next) => {
	
	
});