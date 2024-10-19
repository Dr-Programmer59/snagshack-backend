import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

function getAvatar(avatar){
	if(avatar){
		return `${process.env.BACKEND_URL}/upload/images/${avatar}`
	}
	return avatar;
}

function generateOTP() {
	// Generate a random 6-digit number
	const otp = Math.floor(100000 + Math.random() * 900000);
	return otp.toString(); // Convert to string
}

const schema = new mongoose.Schema({
	name: {type: String, required: true},
	email: {type: String, required: true,unique: true},
	password: {type: String, required: true, selected: false},
	resetPasswordToken: {type: String, default: undefined},
	resetPasswordExpire: {type: String, default: undefined},
	avatar: {type: String,default: undefined,get: getAvatar},
	username: {type: String,default: undefined,unique: false},
	limit:{type:Number,default:0}
	
},{timestamps: true});

schema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
  });
  
  schema.methods.getJWTToken = function () {
	return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
	  expiresIn: "15d",
	});
  };
  
  schema.methods.comparePassword = async function (password) {
	return await bcrypt.compare(password, this.password);
  };


  
  schema.methods.getResetToken = function () {
	const resetToken = crypto.randomBytes(20).toString("hex");
  
	this.resetPasswordToken = crypto
	  .createHash("sha256")
	  .update(resetToken)
	  .digest("hex");
  
	this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  
	return resetToken;
  };

export default mongoose.model('useraccount', schema);