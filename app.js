//to connect db
//mongod --dbpath="C:\Program Files\MongoDB\Server\8.0\data"
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs');

const auctionRoutes = require('./routes/auctionRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const connectDB = require('./config/db.js');

// Connect to DB before server starts
connectDB();

app.use(cors()); //cross platform resourse sharing
app.use(express.json());

app.use(express.static('public')); //frontend

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));


app.get('/', (req, res) => {
  res.send('Auction API is running');
});

app.use(express.urlencoded({ extended: true }));

app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);

// 404 Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});



