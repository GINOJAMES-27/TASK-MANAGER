const express = require('express');
const jsonwebtoken=require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const {login}= require('../../../models/login');
const {token}=require('../../../models/token');
const { sendTextEmail } = require('../../../controllers/email');
const randomstring = require('randomstring');  
const Otp = require('../../../models/otp');
const isAdmin= require('../../../controllers/middleware').isAdmin; 
const task = require('../../../models/task');





const router = express();

router.post('/v1/admin/register', async (req, res) => {
    try {
        const {email,password,role,name,phone}=req.body;//ee order postman data adicandaaa
        if(!email || !password || !role || !name || !phone) {
            return res.status(400).json({
                status:false,
                message:'All fields are required'
            });
        }
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                status: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }
        const existingadmin = await login.findOne({ role: 'admin' });
        if (existingadmin && role === 'admin') {
            return res.status(409).json({
                status: false,
                message: 'Admin user already exists'
            });
        }
        // Assuming phone number should be 10 digits

        // Validate email format
       
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
            status: false,
            message: 'Invalid email format'
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                status: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                status: false,
                message: 'Password must contain uppercase, lowercase letters, and a number'
            });
        }
        const allowedRoles = ['admin', 'enduser'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid role'
            });
        }
        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            return res.status(400).json({
            status: false,
            message: 'Name must contain only letters and spaces'
            });
        }
        if (name.trim().length < 2) {
            return res.status(400).json({
            status: false,
            message: 'Name must be at least 3 characters long'
            });
        }
  
    const phoneno = await login.findOne({ phone: phone });
    if (phoneno && phoneno.status === true) {
        return res.status(409).json({
            status: false,
            message: 'Phone number already registered'
        });
    }

    // Check if email is already registered and verified
    const emailUser = await login.findOne({ email: email });
    if (emailUser && emailUser.status === true) {
        return res.status(409).json({
            status: false,
            message: 'Email already registered'
        });
    }
        
        // Hash password
        const hashpassword = await bcryptjs.hash(password, 10);

         if (role === 'admin') {
            const newUser = new login({
                email,
                password: hashpassword,
                role,
                name,
                phone,
                status: true // Admin is active immediately
            });
            await newUser.save();
            return res.status(201).json({
                status: true,
                message: 'Admin registered successfully.'
            });
        }

        // Create user with status: false
const existingUser = await login.findOne({ email: email });
let user;
if (existingUser) {
    if (existingUser.status === false) {
        // Update the existing unverified user
        existingUser.password = await bcryptjs.hash(password, 10);
        existingUser.role = role;
        existingUser.name = name;
        existingUser.phone = phone;
        await existingUser.save();
        user = existingUser;
        // Continue to OTP generation and sending below
    } else {
        // User is already verified
        return res.status(409).json({
            status: false,
            message: 'Email already registered'
        });
    }
} else {
    // Create user with status: false
    const hashpassword = await bcryptjs.hash(password, 10);
    user = new login({
        email: email,
        password: hashpassword,
        role: role,
        name: name,
        phone: phone,
        status: false // User inactive until OTP verified
    });
    await user.save();
}
// Now generate OTP and send email as usual


        // Generate OTP
        const otpCode = 
        randomstring.generate({
            length: 4,
            charset: 'numeric'
        });
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save OTP to DB
        await Otp.findOneAndUpdate(
            { email },
            { otp: otpCode, expiresAt },
            { upsert: true, new: true }
        );
        const otpHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
    <h2 style="color: #2d8cf0;">Your OTP Code</h2>
    <p style="font-size: 16px; color: #333;">Use the following OTP to verify your email:</p>
    <div style="font-size: 32px; font-weight: bold; color: #2d8cf0; letter-spacing: 8px; margin: 16px 0;">${otpCode}</div>
    <p style="font-size: 14px; color: #888;">This OTP will expire in 5 minutes.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="font-size: 12px; color: #bbb;">If you did not request this, please ignore this email.</p>
  </div>
`;
        // Send OTP email
        await sendTextEmail(
    email,
    'Your OTP Code',
    `Your OTP is: ${otpCode}`,
    otpHtml
);



        res.status(200).json({
            status: true,
            message: 'OTP sent to email. Please verify to activate your account.'
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});
router.post('/v1/admin/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord || otpRecord.expiresAt < new Date()) {
            return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });
        }

        // Activate user
        const user = await login.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        user.status = true;
        await user.save();
         const jwt = jsonwebtoken.sign(
        { 
            userId: user._id,
             role: user.role
        },// Create a JWT token
        // Use a secret key from environment variables or a default value
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }// Set the token to expire in 1 hour
    );

    // Save the token in the token collection
    const newToken = new token({
        loginid: user._id,
        token: jwt,
    });
    await newToken.save();// Save the token to the database


        // Remove OTP record
        await Otp.deleteOne({ email });

        const adminUser = await login.findOne({ role: 'admin' });
        if (adminUser && adminUser.email) {
            const notifyHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
                    <h2 style="color: #2d8cf0;">New User Registered</h2>
                    <p style="font-size: 16px; color: #333;">A new user has completed registration and verified their email.</p>
                    <div style="margin: 16px 0;">
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Name:</strong> ${user.name}<br>
                        <strong>Phone:</strong> ${user.phone}
                    </div>
                    <p style="font-size: 12px; color: #bbb;">This is an automated notification.</p>
                </div>
            `;
            await sendTextEmail(
                adminUser.email,
                'New User Registered',
                `A new user has registered: ${user.email}`,
                notifyHtml
            );
        }

         res.status(200).json({ 
            status: true, 
            message: 'Account activated. You can now log in.',
            token: jwt
        });
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});
router.post('/v1/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required'
            });
        }

        const user = await login.findOne({ email: email });
        if (!user) {
            return res.status(401).json({
                status: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: false,
                message: 'Invalid password'
            });
        }
        
        // Generate JWT token
        const jwtToken = jsonwebtoken.sign(
            { 
                userId: user._id,
                role: user.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );
        
        // Save token
        await token.create({
            loginid: user._id,
            token: jwtToken
        });
        
        // Return ALL needed information including role
        res.status(200).json({
            status: true,
            message: 'Login successful',
            token: jwtToken,
            role: user.role,  // Explicitly send role
            userId: user._id  // Often useful for frontend
        });
        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});

router.get('/v1/admin/totalusers', isAdmin, async (req, res) => {
    try {
        const totalUsers = await login.countDocuments({ role: 'enduser' });
        const users = await login.find({ role: 'enduser' }, '-password');// Count only users
       res.status(200).json({
    status: true,
    message: 'Total users retrieved successfully',
    data: {
        totalUsers,
        users
    }
});
    } catch (error) {
        console.error('Error retrieving total users:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});
router.get('/v1/admin/gettask', isAdmin, async (req, res) => {
    try {
        const tasks = await task.find();
        res.status(200).json({
            status: true,
            message: 'All Task retrieved successfully',
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
router.post('/v1/user/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: false,
                message: 'Email is required'
            });
        }

        const user = await login.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }

        // Generate OTP                                                                                                                                                                 
        const otpCode = randomstring.generate({
            length: 4,
            charset: 'numeric'
        });
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save OTP to DB
        await Otp.findOneAndUpdate(
            { email },
            { otp: otpCode, expiresAt },
            { upsert: true, new: true }
        );

        const otpHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
                <h2 style="color: #2d8cf0;">Password Reset OTP</h2>
                <p style="font-size: 16px; color: #333;">Use the following OTP to reset your password:</p>
                <div style="font-size: 32px; font-weight: bold; color: #2d8cf0; letter-spacing: 8px; margin: 16px 0;">${otpCode}</div>
                <p style="font-size: 14px; color: #888;">This OTP will expire in 5 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="font-size: 12px; color: #bbb;">If you did not request this, please ignore this email.</p>
            </div>
        `;

        await sendTextEmail(
            email,
            'Password Reset OTP',
            `Your OTP for password reset is: ${otpCode}`,
            otpHtml
        );

        res.status(200).json({
            status: true,
            message: 'OTP sent to email. Please use it to reset your password.'
        });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});

// Route to reset password using OTP
router.post('/v1/user/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res.status(400).json({
                status: false,
                message: 'Email, OTP, and new password are required'
            });
        }

        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord || otpRecord.expiresAt < new Date()) {
            return res.status(400).json({
                status: false,
                message: 'Invalid or expired OTP'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                status: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                status: false,
                message: 'Password must contain uppercase, lowercase letters, and a number'
            });
        }

        const user = await login.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }

        user.password = await bcryptjs.hash(password, 10);
        await user.save();

        // Remove OTP record
        await Otp.deleteOne({ email });

        res.status(200).json({
            status: true,
            message: 'Password reset successful. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});
router.get('/v1/user/profile', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                status: false,
                message: 'User ID is required'
            });
        }
        const user = await login.findById(userId, '-password');
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            status: true,
            message: 'Profile retrieved successfully',
            data: user
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
});




module.exports=router;