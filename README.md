# Task Management API 🚀

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)
![JWT](https://img.shields.io/badge/JWT-Auth-blue)

A robust REST API for task management with authentication, role-based access control, and real-time email notifications.

## Table of Contents 📚
- [Features](#features-)
- [API Endpoints](#api-endpoints-)
- [Installation](#installation-)
- [Environment Variables](#environment-variables-)
- [Usage Examples](#usage-examples-)
- [Database Models](#database-models-)
- [Error Handling](#error-handling-)
- [License](#license-)

## Features ✨

- **User Authentication**
  - JWT-based authentication
  - Role-based access (Admin/End User)
  - Secure password hashing with bcrypt
  - OTP verification via email

- **Task Management**
  - Create, read, update, delete tasks
  - Mark tasks as pending/in progress/completed
  - Set priorities (Low/Medium/High)
  - Due date tracking

- **Collaboration**
  - Assign tasks to multiple users
  - Automatic email notifications
  - Task update alerts

- **Security**
  - Input validation
  - Rate limiting (recommended)
  - HTTPS support (recommended)

## API Endpoints 🌐

### Authentication 🔒

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/v1/admin/register` | POST | Register new user | Public |
| `/v1/admin/verify-otp` | POST | Verify email with OTP | Public |
| `/v1/admin/login` | POST | User login | Public |
| `/v1/user/forget-password` | POST | Request password reset OTP | Public |
| `/v1/user/reset-password` | POST | Reset password with OTP | Public |

### User Profile 👤

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/v1/user/profile` | GET | Get user profile | Private |

### Admin Routes 👨‍💼

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/v1/admin/totalusers` | GET | Get all users | Admin |
| `/v1/admin/gettask` | GET | Get all tasks | Admin |

### Task Management ✅

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/v1/user/addtask` | POST | Create new task | Private |
| `/v1/user/updatetask/:taskId` | PUT | Update task | Private |
| `/v1/user/deletetask/:taskId` | DELETE | Delete task | Private |
| `/v1/user/gettask` | GET | Get user's tasks | Private |
| `/v1/user/completetask/:taskId` | PATCH | Mark task as completed | Private |
| `/v1/user/inprogress-task/:taskId` | PATCH | Mark task as in progress | Private |

### Collaborative Tasks 👥

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/v1/user/add-collab-task` | POST | Create collaborative task | Private |
| `/v1/user/update-collab-task/:taskId` | PUT | Update collaborative task | Private |

## Installation ⚙️

1. Clone the repository:
   ```bash
   https://github.com/GINOJAMES-27/TASK-MANAGER.git
   
