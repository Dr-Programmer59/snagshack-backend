
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	email: {type: String, required: true},
	coupanActivated: {type: Boolean, required: true},
	used: {type: Boolean, required: true},

	
},{timestamps: true});


export default mongoose.model('uber_account', schema);


