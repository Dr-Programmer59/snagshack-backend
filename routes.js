import express from 'express';
import {changePassword, loadme, login, logout, register, updateUser,forgotPassword,resetPassword, checkOTP} from './controllers/user.js';
import { isAuthenticate, isCheckRole } from './middlewares/auth.js';
import singleUpload from './middlewares/multer.js';

import { sendcoupanEmail } from './controllers/coupans.js';
const router = express.Router();

// users routes
router.route('/register').post(singleUpload, register);
router.route('/login').post(login);
router.route('/me').get(isAuthenticate,loadme);
router.route('/logout').get(logout);
router.route('/user/update').put(isAuthenticate,singleUpload,updateUser);
router.route('/user/change-password').put(isAuthenticate,changePassword);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').put(resetPassword);


// coupans apis

router.route("/get-coupan").get(isAuthenticate,sendcoupanEmail);

router.route("/check",async (req, res, next) => {
    res.status(200).json({
        success: true,
        
    })
})





export default router;