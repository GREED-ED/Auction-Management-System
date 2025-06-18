const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const SECRET_KEY = process.env.JWT_SECRET;


// Signup
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // const token = jwt.sign({ id: user._id }, 'your_jwt_secret');

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

module.exports = router;
