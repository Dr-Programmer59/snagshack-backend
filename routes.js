
import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });
import express from 'express';
import {changePassword, loadme, login, logout, register, updateUser,forgotPassword,resetPassword, checkOTP, update_subscription} from './controllers/user.js';
import { isAuthenticate, isCheckRole } from './middlewares/auth.js';
import singleUpload from './middlewares/multer.js';
import Stripe from "stripe"

const stripe = Stripe(process.env.STRIPE_KEY);
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

router.route("/verify-").post(async (req, res, next) => {
  const {session_id}=req.body;

  const check = await stripe.checkout.sessions.retrieve(session_id );
    
  if (check.payment_status === 'paid') {
    // Payment was successful
    console.log('Payment successful');
  } else {
    // Payment failed or still processing
    console.log('Paymen nott successful');
  }
})

router.route("/update-subscription").post(isAuthenticate,update_subscription)
router.route("/create-checkout-session").post(async (req, res,next) => {
        console.log("somethign")
        const  productId  = process.env.PRODUCTID;
        console.log(productId)
        try {
          // Create a Checkout Session
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price: productId, // Use the price ID from your Stripe dashboard (associated with the product)
                quantity: 1,
              },
            ],
            mode: 'subscription', // Use 'subscription' for recurring payments
            success_url:  `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`, // URL to redirect to on successful payment
            cancel_url: 'http://localhost:3000/cancel',  // URL to redirect to on payment failure/cancellation
          });
          console.log("seesion")
          console.log(session)
          // Send session ID back to frontend
         
       
          res.status(200).json({ id: session.id });
        } catch (error) {
            console.log(error)
          res.status(500).json({ error: error.message });
        }
      }
)
  





export default router;