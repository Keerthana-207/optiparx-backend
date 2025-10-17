const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const userModel = require('./models/user');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const allowedOrigins = ['https://optiparx-users.netlify.app/'];

// Middleware
app.use(express.json());

app.use(cors({
  origin: 'https://optiparx-users.netlify.app',
  credentials: true
}));


// Connect to MongoDB
connectDB();

// Routes
const slotRoutes = require('./routes/slotRoutes');
app.use('/api/slots', slotRoutes);

// ✅ User Registration
app.post('/register', async (req, res) => {
  try {
    const { username, phone, email, password } = req.body;

    if (!username || !password || (!phone && !email)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      username,
      phone,
      email,
      password: hashedPassword,
      bookings: []
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// ✅ User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userModel.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Booking Confirmation Stub (Handled in /api/slots)
app.post('/book', async (req, res) => {
  try {
    const { username, carPlate, slot, duration } = req.body;

    const missingFields = [];
    if (!username) missingFields.push("username");
    if (!carPlate) missingFields.push("carPlate");
    if (!slot) missingFields.push("slot");
    if (!duration) missingFields.push("duration");

    if (missingFields.length) {
      return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    res.status(200).json({ message: "Booking confirmed" });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Server error while confirming booking" });
  }
});

// ✅ Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ message: 'Admin login successful' });
  }

  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// Start Server
app.listen(3000, () => {
  console.log("🚀 Server is running at http://localhost:3000");
});
