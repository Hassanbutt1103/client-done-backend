# VP Engenharia Backend Server (No Database)

Simple backend API server for the VP Engenharia Dashboard application with JWT authentication and mock user data.

## 🚀 Features

- **JWT Authentication**: Token-based login/logout system
- **Role-Based Access Control**: Admin, Manager, Financial, Engineering, HR, Commercial, Purchasing
- **Mock User Data**: Pre-configured test users (no database required)
- **Security Middleware**: CORS, Helmet, Rate Limiting, XSS Protection
- **Password Hashing**: Secure bcrypt password encryption
- **Environment Configuration**: .env file based configuration

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**

## ⚙️ Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Create .env file in server directory
   touch .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   # JWT Configuration
   JWT_SECRET=vp-engenharia-super-secret-key-2024-change-in-production
   JWT_EXPIRES_IN=30d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

## 🏃‍♂️ Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 👥 Test User Accounts

The server includes pre-configured test accounts with these credentials:

| Role | Email | Password | User Type |
|------|--------|----------|-----------|
| **Admin** | admin@vpengenharia.com | admin123 | admin |
| **Manager** | gerente@vpengenharia.com | gerente123 | manager |
| **Financial** | financeiro@vpengenharia.com | financeiro123 | financial |
| **Engineering** | engenharia@vpengenharia.com | engenharia123 | engineering |
| **HR** | rh@vpengenharia.com | rh123 | hr |
| **Commercial** | comercial@vpengenharia.com | comercial123 | commercial |
| **Purchasing** | compras@vpengenharia.com | compras123 | purchasing |

## 📡 API Endpoints

### Authentication Routes
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

### Protected Routes (Require Authentication)
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Admin Only Routes
- `GET /api/v1/users` - Get all users

### Utility Routes
- `GET /api/health` - Health check

## 🔧 API Usage Examples

### Login Request:
```bash
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vpengenharia.com",
    "password": "admin123",
    "userType": "admin"
  }'
```

### Protected Route Request:
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📁 Project Structure

```
server/
├── controllers/
│   └── userController.js    # User business logic (mock data)
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   └── userRoutes.js        # API routes
├── package.json             # Dependencies
├── server.js                # Main server file
├── .env                     # Environment variables
└── README.md                # This file
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for frontend domains
- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: XSS and injection prevention
- **Security Headers**: Helmet middleware

## 🐛 Troubleshooting

### Common Issues:

1. **Port Already in Use:**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`

2. **JWT Token Issues:**
   - Ensure JWT_SECRET is set in .env
   - Check token expiration
   - Verify token format in requests

3. **CORS Errors:**
   - Check frontend URL in CORS configuration
   - Ensure credentials: true for authenticated requests

## 🔐 Environment Variables

Create a `.env` file in the server directory with these variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Frontend URL (for CORS if needed)
# CLIENT_URL=http://localhost:5175
```

## 🚀 Quick Start

1. **Create .env file with JWT secret**
2. **Install dependencies:** `npm install`
3. **Start server:** `npm run dev`
4. **Test login with any of the provided accounts**
5. **Frontend connects to:** `http://localhost:5000/api/v1/users/login`

## 📝 Notes

- **No Database Required**: Uses in-memory mock data
- **Test Users Only**: Registration is disabled
- **Demo Version**: Password change is disabled
- **Session Based**: JWT tokens for authentication
- **Role Permissions**: Each role has specific access rights

## 🔄 Integration

Your frontend should connect to:
- **Base URL**: `http://localhost:5000`
- **Login Endpoint**: `/api/v1/users/login`
- **Auth Header**: `Authorization: Bearer {token}`

Perfect for development, testing, and demos without database setup complexity! 