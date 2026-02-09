Porsche - Exclusive Showroom & Wiki API

Drive the Legend. Experience the Future.
A full-stack luxury car rental platform built with the MERN stack (MongoDB, Express, Node.js).



 Project Overview
Porsche is not just a rental site; it's a digital experience. It features a sleek, dark-themed UI with glassmorphism effects, a secure RESTful API, and real-time integration with vehicle databases.

Key Features:
- Role-Based Access Control (RBAC): Admins manage the fleet; Users rent their dream cars.
- Secure Authentication: JWT (JSON Web Tokens) & Bcrypt password hashing.
- Dynamic Showroom: Real-time availability status (Available/Rented).
- Tech Specs Wiki: Fetches live engineering data (Engine, HP, MPG) via API Ninjas.
- Enterprise Security: Helmet.js, Rate Limiting, Data Validation (Joi), CORS.
- Responsive UI: "Dark Mode" luxury design with CSS animations.



Tech Stack
   Backend: Node.js, Express.js (High-performance REST API)
   Database: MongoDB, Mongoose (NoSQL data modeling & relations)
   Frontend: HTML5, CSS3, Vanilla JS (Lightweight, fast, glassmorphism UI)
   Validation: Joi (Strict input validation middleware)
   Security: Helmet, Bcrypt, JWT (Industry-standard protection)
   External API: API Ninjas (Real-time vehicle specifications)



Installation & Setup

 1. Clone the Repository
git clone https://github.com/kalmandyt-png/Porsche.git
cd porsche-hub
 

 2. Install Dependencies
npm install
 

 3. Configure Environment
Create a `.env` file in the root directory:
PORT=3000
MONGO_URI=mongodb+srv://k4lmbtw:OVaFdyNrwgRFu1Zt@porsche.gocmose.mongodb.net/?appName=Porsche
JWT_SECRET=your_super_secret_key_123
EXTERNAL_API_KEY=your_api_ninjas_key
 

 4. Run the Server
npm start
 
Visit vercel link to view the app.



 📡 API Documentation

 🔒 Authentication
   POST `/api/auth/register` - Register new user (Joi Validated)
   POST `/api/auth/login` - Authenticate & get JWT Token

 🏎️ Cars (Showroom)
   GET `/api/cars` - Get full fleet list
   POST `/api/cars` - (Admin) Add new car to fleet
   PUT `/api/cars/rent/:id` - (Auth) Rent a specific car
   PUT `/api/cars/return/:id` - (Auth) Return a rented car
   DELETE `/api/cars/:id` - (Admin) Remove car from fleet

 📚 Wiki (Specs)
   GET `/api/cars/specs/:model` - Fetch external specs (Engine, Class, etc.)

 👤 User Profile
   GET `/api/users/profile` - (Auth) Get current user info
   GET `/api/cars/my/rentals` - (Auth) Get user's active rentals



Built for Web Development Final Project
