import {app} from './app.js';
// const cron = require('node-cron');
import cron from "node-cron"
import user from './models/user.js';

const PORT = process.env.PORT || 8000;
const resetDatabase = async() => {
    console.log('Resetting backend at 12:00 PM...');
    // Your reset logic here (e.g., clear collections, reset data)
    try {
        console.log('Resetting user limits at 12:00 PM...');
        
        // Update all users and set the `limit` field to 0
        const result = await user.updateMany({}, { $set: { limit: 0 } });
        
        console.log(`Successfully reset limits for ${result.nModified} users.`);
    } catch (error) {
        console.error('Error resetting user limits:', error);
    }
};

// Schedule the reset task to run every day at 12:00 PM
cron.schedule('0 0 * * *', () => {
    resetDatabase();
});
app.listen(PORT, () => console.log('server running on port 4000'));