# Wanderlux Travel Booking Platform

A full-stack, proper modularized version of the Wanderlux project using **Node.js, Express, and MySQL**.

## Project Structure
```text
wanderlux/
├── frontend/             # All frontend code (HTML, CSS, JS)
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Cleanly extracted CSS
│   └── js/               # Modular JavaScript logic
│       ├── api.js        # API fetch wrappers
│       ├── main.js       # Core UI interactions & Modals
│       ├── auth.js       # Login / Signup / Logout logic
│       ├── packages.js   # Dynamic package rendering & Wishlist
│       ├── bookings.js   # Booking flow, Cancellation, My Trips
│       └── profile.js    # User Profile logic
├── backend/              # Node.js backend
│   ├── server.js         # Express app entry point
│   ├── package.json      # Dependencies
│   ├── .env              # Environment config
│   ├── config/           # Database connection logic
│   ├── routes/           # REST API route definitions
│   └── controllers/      # Route logic handlers
└── database/             # MySQL schema and data
    ├── schema.sql        # 12-table structured schema
    ├── seed.sql          # Sample data
    ├── queries.sql       # Test queries
    └── procedures.sql    # Functions, triggers, and procedures
```

## Setup Instructions

### 1. Database Setup
1. Ensure MySQL is running on your machine (via XAMPP, WAMP, or standalone).
2. Create the database and import the tables by running the SQL files in order, or simply run the compiled file if you have it:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p wanderlux_db < database/seed.sql
mysql -u root -p wanderlux_db < database/procedures.sql
```

### 2. Backend Setup
1. Open a terminal inside the `backend` folder:
```bash
cd backend
```
2. Install the necessary Node.js dependencies:
```bash
npm install
```
3. Open the `backend/.env` file and ensure your database credentials (`DB_USER`, `DB_PASSWORD`) match your local MySQL setup.
4. Start the server:
```bash
npm run dev
```
*(The server will start on port 3000)*

### 3. View the Website
The backend automatically serves the `frontend/` folder. 
Open your browser and navigate to:
**http://localhost:3000**

You can now log in, view packages, make bookings, and add to your wishlist—all data will be saved permanently to your MySQL database!
