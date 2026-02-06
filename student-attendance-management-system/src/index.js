import app from './app.js';
import { scheduleTokenCleanup } from './utils/cleanupExpiredTokens.js';
import initAttendanceCron from './services/cron.service.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
    console.log(`app is running on ${PORT}`);
    
    // Schedule automatic token cleanup
    scheduleTokenCleanup();

    // Initialize attendance monthly cron job
    initAttendanceCron();
});
