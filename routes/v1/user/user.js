const express = require('express');
const mongoose = require('mongoose');
const { login } = require('../../../models/login');
const isUser = require('../../../controllers/middleware').isUser;
const sendTextEmail = require('../../../controllers/email').sendTextEmail;
const task= require('../../../models/task');
const Otp = require('../../../models/otp');
const bcryptjs = require('bcryptjs');   
const randomstring = require('randomstring');


const router = express();


// ...existing code...

// Route to add a new task
router.post('/v1/user/addtask', isUser, async (req, res) => {
    try {
        const { title, description, dueDate, priority, status } = req.body;
        const userId = req.user._id; // assuming isUser middleware sets req.user
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Title is required and must be a non-empty string'
            });
        }
        if (description && typeof description !== 'string') {
            return res.status(400).json({
                status: false,
                message: 'Description must be a string'
            });
        }
if (dueDate) {
    // Reject if not a string
    if (typeof dueDate !== 'string') {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a string in ISO format'
        });
    }
    // Reject if string contains only digits (e.g., "123")
    if (/^\d+$/.test(dueDate.trim())) {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a valid date string, not just numbers'
        });
    }
    // Reject if not a valid date
    if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a valid date'
        });
    }
}
        const allowedPriorities = ['Low', 'Medium', 'High'];
        if (priority && !allowedPriorities.includes(priority)) {
            return res.status(400).json({
                status: false,
                message: `Priority must be one of: ${allowedPriorities.join(', ')}`
            });
        }
        const allowedStatuses = ['Pending', 'In Progress', 'Completed'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: `Status must be one of: ${allowedStatuses.join(', ')}`
            });
        }

        const newTask = new task({
            userId,
            title,
            description,
            dueDate,
            priority,
            status
        });
        await newTask.save();

        await sendTextEmail(
            req.user.email,
            'Task Created Successfully',
            undefined,
             `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
        <h2 style="color: #22c55e; margin-bottom: 12px; text-align: center;">✅ Task Created Successfully</h2>
        <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${req.user.name}</b>,<br>Your new task "<b>${title}</b>" has been created successfully.</p>
        <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
            <table style="width:100%; font-size:15px; color:#222;">
                <tr>
                    <td style="padding: 6px 0;"><b>Description:</b></td>
                    <td style="padding: 6px 0;">${description || 'No description'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Due Date:</b></td>
                    <td style="padding: 6px 0;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Priority:</b></td>
                    <td style="padding: 6px 0;">${priority || 'Low'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Status:</b></td>
                    <td style="padding: 6px 0;">${status || 'Pending'}</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Thank you for using our task manager!</p>
        <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">If you have any questions, reply to this email.</p>
    </div>`
    
        );  

        res.status(201).json({
            status: true,
            message: 'Task added successfully',
            data: newTask
        });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});

// Route to update a task
router.put('/v1/user/updatetask/:taskId', isUser, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, dueDate, priority, status } = req.body;

        // Only allow updating tasks belonging to the logged-in user
        const updatedTask = await task.findOneAndUpdate(
            { _id: taskId, userId: req.user._id },
            { title, description, dueDate, priority, status },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({
                status: false,
                message: 'Task not found or not authorized'
            });
        }
                if (description && typeof description !== 'string') {
            return res.status(400).json({
                status: false,
                message: 'Description must be a string'
            });
        }
if (dueDate) {
    // Reject if not a string
    if (typeof dueDate !== 'string') {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a string in ISO format'
        });
    }
    // Reject if string contains only digits (e.g., "123")
    if (/^\d+$/.test(dueDate.trim())) {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a valid date string, not just numbers'
        });
    }
    // Reject if not a valid date
    if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            status: false,
            message: 'Due date must be a valid date'
        });
    }
}
        const allowedPriorities = ['Low', 'Medium', 'High'];
        if (priority && !allowedPriorities.includes(priority)) {
            return res.status(400).json({
                status: false,
                message: `Priority must be one of: ${allowedPriorities.join(', ')}`
            });
        }
        const allowedStatuses = ['Pending', 'In Progress', 'Completed'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: `Status must be one of: ${allowedStatuses.join(', ')}`
            });
        }
        const { title: taskTitle, description: taskDescription, dueDate: taskDueDate, priority: taskPriority, status: taskStatus } = updatedTask;
        await sendTextEmail(
            req.user.email,
            'Task Updated Successfully',
            undefined,
             `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
        <h2 style="color: #22c55e; margin-bottom: 12px; text-align: center;">✅ Task updated Successfully</h2>
        <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${req.user.name}</b>,<br>Your task "<b>${title}</b>" has been created successfully.</p>
        <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
            <table style="width:100%; font-size:15px; color:#222;">
                <tr>
                    <td style="padding: 6px 0;"><b>Description:</b></td>
                    <td style="padding: 6px 0;">${description || 'No description'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Due Date:</b></td>
                    <td style="padding: 6px 0;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Priority:</b></td>
                    <td style="padding: 6px 0;">${priority || 'Low'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Status:</b></td>
                    <td style="padding: 6px 0;">${status || 'Pending'}</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Thank you for using our task manager!</p>
        <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">If you have any questions, reply to this email.</p>
    </div>`
    
        );

        res.status(200).json({
            status: true,
            message: 'Task updated successfully',
            data: updatedTask
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});

router.delete('/v1/user/deletetask/:taskId', isUser, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Hard delete: permanently remove the task
        const deletedTask = await task.findOneAndDelete({
            _id: taskId,
            userId: req.user._id
        });

        if (!deletedTask) {
            return res.status(404).json({
                status: false,
                message: 'Task not found or not authorized'
            });
        }

        // (Optional) Send email notification as before
        const { title, description, dueDate, priority, status } = deletedTask;
        await sendTextEmail(
            req.user.email,
            'Task Deleted Successfully',
            undefined,
            `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
                <h2 style="color: #ef4444; margin-bottom: 12px; text-align: center;">🗑️ Task Deleted</h2>
                <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${req.user.name}</b>,<br>Your task "<b>${title}</b>" has been <b>deleted</b> successfully.</p>
                <div style="margin: 24px 0; background: #ffe4e6; border-radius: 8px; padding: 18px;">
                    <table style="width:100%; font-size:15px; color:#222;">
                        <tr>
                            <td style="padding: 6px 0;"><b>Description:</b></td>
                            <td style="padding: 6px 0;">${description || 'No description'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Due Date:</b></td>
                            <td style="padding: 6px 0;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Priority:</b></td>
                            <td style="padding: 6px 0;">${priority || 'Low'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Status:</b></td>
                            <td style="padding: 6px 0;">${status || 'Pending'}</td>
                        </tr>
                    </table>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">The above task has been removed from your list.</p>
                <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">If you have any questions, reply to this email.</p>
            </div>`
        );

        res.status(200).json({
            status: true,
            message: 'Task hard deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});
router.get('/v1/user/gettask', isUser, async (req, res) => {
    try {
        // Only retrieve tasks belonging to the logged-in user
        const tasks = await task.find({ userId: req.user._id });
        res.status(200).json({
            status: true,
            message: 'User tasks retrieved successfully',
            data: tasks
        });
    } catch (error) {
        console.error('Error retrieving TASKS:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});


// Route to mark a task as completed
router.patch('/v1/user/completetask/:taskId', isUser, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Only allow updating tasks belonging to the logged-in user
        const completedTask = await task.findOneAndUpdate(
            { _id: taskId, userId: req.user._id },
            { status: 'Completed' },
            { new: true }
        );

        if (!completedTask) {
            return res.status(404).json({
                status: false,
                message: 'Task not found or not authorized'
            });
        }

        await sendTextEmail(
            req.user.email,
            'Task Marked as Completed',
            undefined,
            `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
                <h2 style="color: #22c55e; margin-bottom: 12px; text-align: center;">🎉 Task Completed</h2>
                <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${req.user.name}</b>,<br>Your task "<b>${completedTask.title}</b>" has been marked as <b>Completed</b>.</p>
                <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
                    <table style="width:100%; font-size:15px; color:#222;">
                        <tr>
                            <td style="padding: 6px 0;"><b>Description:</b></td>
                            <td style="padding: 6px 0;">${completedTask.description || 'No description'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Due Date:</b></td>
                            <td style="padding: 6px 0;">${completedTask.dueDate ? new Date(completedTask.dueDate).toLocaleDateString() : 'No due date'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Priority:</b></td>
                            <td style="padding: 6px 0;">${completedTask.priority || 'Low'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Status:</b></td>
                            <td style="padding: 6px 0;">${completedTask.status}</td>
                        </tr>
                    </table>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">Congratulations on completing your task!</p>
                <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">If you have any questions, reply to this email.</p>
            </div>`
        );

        res.status(200).json({
            status: true,
            message: 'Task marked as completed',
            data: completedTask
        });
    } catch (error) {
        console.error('Error marking task as completed:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});
// ...existing code...

// Route to request password reset (send OTP)

// Route to create a collaborative task and notify assignees
router.post('/v1/user/add-collab-task', isUser, async (req, res) => {
    try {
        const { title, description, dueDate, priority, status, assignees } = req.body;
        const userId = req.user._id;

        // Basic validation (add more as needed)
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Title is required and must be a non-empty string'
            });
        }

        // Create the task with assignees
        const newTask = new task({
            userId,
            title,
            description,
            dueDate,
            priority,
            status,
            assignees // array of user IDs
        });
        await newTask.save();

        // Notify assignees
        if (assignees && assignees.length > 0) {
            const assigneeUsers = await login.find({ _id: { $in: assignees } });
            for (const assignee of assigneeUsers) {
             await sendTextEmail(
    assignee.email,
    'You have been assigned a new task',
    undefined,
    `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
        <h2 style="color: #2563eb; margin-bottom: 12px; text-align: center;">👥 New Task Assigned</h2>
        <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${assignee.name}</b>,<br>
        You have been assigned to the task "<b>${title}</b>".</p>
        <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
            <table style="width:100%; font-size:15px; color:#222;">
                <tr>
                    <td style="padding: 6px 0;"><b>Description:</b></td>
                    <td style="padding: 6px 0;">${description || 'No description'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Due Date:</b></td>
                    <td style="padding: 6px 0;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Please check your dashboard for more details.</p>
        <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">This is an automated notification.</p>
    </div>`
);
            }
        }

        res.status(201).json({
            status: true,
            message: 'Collaborative task added and assignees notified',
            data: newTask
        });
    } catch (error) {
        console.error('Error adding collaborative task:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});

// Route to update a collaborative task and notify assignees
router.put('/v1/user/update-collab-task/:taskId', isUser, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, dueDate, priority, status, assignees } = req.body;

        const updatedTask = await task.findOneAndUpdate(
            { _id: taskId, userId: req.user._id },
            { title, description, dueDate, priority, status, assignees },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({
                status: false,
                message: 'Task not found or not authorized'
            });
        }

        // Notify assignees
        if (updatedTask.assignees && updatedTask.assignees.length > 0) {
            const assigneeUsers = await login.find({ _id: { $in: updatedTask.assignees } });
            for (const assignee of assigneeUsers) {
await sendTextEmail(
    assignee.email,
    'Your task has been updated',
    undefined,
    `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
        <h2 style="color: #2563eb; margin-bottom: 12px; text-align: center;">👥 Task Updated</h2>
        <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${assignee.name}</b>,<br>
        The task "<b>${updatedTask.title}</b>" you are assigned to has been updated .</p>
        <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
            <table style="width:100%; font-size:15px; color:#222;">
                <tr>
                    <td style="padding: 6px 0;"><b>Description:</b></td>
                    <td style="padding: 6px 0;">${updatedTask.description || 'No description'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0;"><b>Due Date:</b></td>
                    <td style="padding: 6px 0;">${updatedTask.dueDate ? new Date(updatedTask.dueDate).toLocaleDateString() : 'No due date'}</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Please check your dashboard for more details.</p>
        <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">This is an automated notification.</p>
    </div>`
);
            }
        }

        res.status(200).json({
            status: true,
            message: 'Collaborative task updated and assignees notified',
            data: updatedTask
        });
    } catch (error) {
        console.error('Error updating collaborative task:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/v1/user/inprogress-task/:taskId', isUser, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Only allow updating tasks belonging to the logged-in user
        const inprogressTask = await task.findOneAndUpdate(
            { _id: taskId, userId: req.user._id },
            { status: 'In Progress' },
            { new: true }
        );

        if (!inprogressTask) {
            return res.status(404).json({
                status: false,
                message: 'Task not found or not authorized'
            });
        }

        await sendTextEmail(
            req.user.email,
            'Task is In Progress',
            undefined,
            `<div style="font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; border: 1px solid #e3e8ee; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px 28px; background: #f6f9fb;">
                <h2 style="color: #22c55e; margin-bottom: 12px; text-align: center;">🎉 Task In Progress</h2>
                <p style="font-size: 16px; color: #222; text-align: center;">Hello <b>${req.user.name}</b>,<br>Your task "<b>${inprogressTask.title}</b>" has been marked as <b>In Progress</b>.</p>
                <div style="margin: 24px 0; background: #e0e7ff; border-radius: 8px; padding: 18px;">
                    <table style="width:100%; font-size:15px; color:#222;">
                        <tr>
                            <td style="padding: 6px 0;"><b>Description:</b></td>
                            <td style="padding: 6px 0;">${inprogressTask.description || 'No description'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Due Date:</b></td>
                            <td style="padding: 6px 0;">${inprogressTask.dueDate ? new Date(inprogressTask.dueDate).toLocaleDateString() : 'No due date'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Priority:</b></td>
                            <td style="padding: 6px 0;">${inprogressTask.priority || 'Low'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0;"><b>Status:</b></td>
                            <td style="padding: 6px 0;">${inprogressTask.status}</td>
                        </tr>
                    </table>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">Keep up the good work on your task!</p>
                <hr style="border: none; border-top: 1px solid #e3e8ee; margin: 32px 0;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">If you have any questions, reply to this email.</p>
            </div>`
        );

        res.status(200).json({
            status: true,
            message: 'Task marked as in progress',
            data: inprogressTask
        });
    } catch (error) {
        console.error('Error marking task as in progress:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});








module.exports=router;
