const jsonwebtoken=require('jsonwebtoken');
const {login} = require('../models/login');



module.exports = {
    isAdmin: async (req, res, next) => {
        const token= req.headers["token"];
        if(token)
        {
            try {
                const decoded= jsonwebtoken.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                const user =await login.findOne({ _id: decoded.userId, status: true });//not using fimdById because we are using _id in token so inactiave user id indaaa

                if(!user)
                {
                    return res.status(401).json({
                        status: false,
                        message: 'User not found'
                    });
                }
                
                if(user.role !== 'admin')
                {
                    return res.status(403).json({
                        status: false,
                        message: 'Access denied, admin only'
                    });
                }
                req.user =user;
                
            } catch (error) {
                return res.status(500).json({
                    status: false,
                    message: 'not verified'
                });
                
            }
        }
        else
        {
            return res.status(401).json({
                status: false,
                message: 'Invalid token'
            });
        }
        next();
    },
        isUser: async (req, res, next) => {
            const token = req.headers["token"];
            if (token) {
                try {
                    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                    const user = await login.findOne({ _id: decoded.userId, status: true });
    
                    if (!user) {
                        return res.status(401).json({
                            status: false,
                            message: 'User not found'
                        });
                    }
    
                    if (user.role !== 'enduser') {
                        return res.status(403).json({
                            status: false,
                            message: 'Access denied, user only'
                        });
                    }
                    req.user = user;
    
                } catch (error) {
                    return res.status(500).json({
                        status: false,
                        message: 'not verified'
                    });
                }
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'Invalid token'
                });
            }
            next();
        }
}