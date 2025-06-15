const cron = require('node-cron');
const Task = require('./models/task');
const { login } = require('./models/login');
const sendTextEmail = require('./controllers/email').sendTextEmail;

cron.schedule('0 12 * * *', async () => { // 12:00 PM
    try {
        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);

        // Find tasks due in the next 3 days and not completed
        const tasks = await Task.find({
            dueDate: { $gte: now, $lte: threeDaysLater },
            status: { $ne: 'Completed' }
        });

        for (const t of tasks) {
            const user = await login.findById(t.userId);
            if (!user || !user.email) continue;

            await sendTextEmail(
                user.email,
                'Task Due Soon Reminder',
                undefined,
                `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
                    <h2 style="color: #eab308; margin-bottom: 12px; text-align: center;">⏰ Task Due Soon</h2>
                    <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${user.name || ''}</b>,<br>Your task "<b>${t.title}</b>" is due on <b>${t.dueDate.toLocaleDateString()}</b>.</p>
                    <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
                        <table style="width:100%; font-size:15px; color:#222;">
                            <tr>
                                <td style="padding: 6px 0;"><b>Description:</b></td>
                                <td style="padding: 6px 0;">${t.description || 'No description'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0;"><b>Priority:</b></td>
                                <td style="padding: 6px 0;">${t.priority || 'Low'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0;"><b>Status:</b></td>
                                <td style="padding: 6px 0;">${t.status || 'Pending'}</td>
                            </tr>
                        </table>
                    </div>
                    <p style="font-size: 14px; color: #666; text-align: center;">Please complete your task before the due date.</p>
                    <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
                    <p style="font-size: 12px; color: #aaa; text-align: center;">This is an automated reminder.</p>
                </div>`
            );
        }
        console.log('Due date notifications sent.');
    } catch (error) {
        console.error('Error sending due date notifications:', error);
    }
});

