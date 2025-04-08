# Bank Management System

A full-stack bank management system with role-based authentication and basic banking operations.

## Features
- Role-based authentication (Customer/Employee)
- User registration and login
- Bank account creation for customers
- Transaction management (view, withdraw, deposit)
- Secure authentication and authorization

## Tech Stack
- Frontend: React.js
- Backend: Express.js
- Database: MySQL

## Project Structure
```
bank-management/
├── frontend/          # React frontend application
├── backend/           # Express backend server
└── database/          # Database scripts and configurations
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=bank_management
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Database Setup
1. Create a MySQL database named 'bank_management'
2. Run the SQL scripts in the database directory to set up the schema

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Customer Operations
- POST /api/accounts - Create new bank account
- GET /api/accounts/:id - Get account details
- GET /api/transactions/:accountId - Get transaction history
- POST /api/transactions/deposit - Deposit funds
- POST /api/transactions/withdraw - Withdraw funds 