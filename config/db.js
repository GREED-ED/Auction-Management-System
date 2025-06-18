// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // await mongoose.connect('mongodb://127.0.0.1:27017/auctionDB', {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    await mongoose.connect('mongodb://127.0.0.1:27017/auctionDB'); //Robo3T ma check gar
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  } 
};

module.exports = connectDB;
