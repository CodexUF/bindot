# BinDot Vehicle Booking System

BinDot is a full-stack vehicle booking and management system designed for car rental businesses. It features a comprehensive admin dashboard to manage customers, vehicles, and bookings efficiently. The backend is built with Node.js and Express, while the frontend is a modern React application styled with Tailwind CSS.

## Features

-   **Analytics Dashboard**: An overview of key metrics, including total revenue, booking counts, vehicle availability, and recent activity, complete with charts for monthly revenue.
-   **Customer Management (CRUD)**: Easily add, view, update, and delete customer profiles.
-   **Vehicle Fleet Management (CRUD)**: Manage vehicle details, including make, model, daily rates, and status (available, booked, maintenance).
-   **Booking Management (CRUD)**: Create new bookings, update their status (pending, confirmed, active, completed, cancelled), and delete them. The system automatically handles vehicle availability checks and calculates total costs.
-   **Secure Authentication**: JWT-based authentication for admin users, including signup and login functionality.
-   **RESTful API**: A well-structured API for all backend operations.
-   **Modern UI/UX**: A clean, responsive, and modern user interface built with React, TypeScript, and Tailwind CSS.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Axios, React Router, Recharts
-   **Backend**: Node.js, Express.js, Mongoose, JSON Web Tokens (JWT)
-   **Database**: MongoDB


## Getting Started

### 1. Prerequisites

-   Node.js (v16.x or later)
-   MongoDB (a local instance or a cloud service like MongoDB Atlas)

### 2. Clone the Repository

```bash
git clone https://github.com/codexuf/bindot.git
cd bindot
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory and add the following configuration:

```ini
# backend/.env

# Port for the backend server
PORT=5000

# Your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/bindot

# Secret for signing JWTs (use a long, random string)
JWT_SECRET=your_jwt_secret_key

# JWT token expiration (e.g., 7d, 24h)
JWT_EXPIRES_IN=7d
```

### 4. Install Dependencies

This single command installs dependencies for the root, backend, and frontend projects.

```bash
npm run install:all
```

### 5. Run the Application

This command starts the frontend and backend development servers concurrently.

```bash
npm run dev
npm start
```
-   The **frontend server** will be accessible at `http://localhost:3000`.
-   The **backend server ** will be accessible at `http://localhost:5000`.



<p align="center">
  <img src="/Activity_Diagram_Bindot.png" alt="Activity_Diagram_Bindot" width="400">
</p>

