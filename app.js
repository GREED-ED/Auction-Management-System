//to connect db
//mongod --dbpath="C:\Program Files\MongoDB\Server\8.0\data"
const express = require('express');
const cors = require('cors');
const app = express();

const auctionRoutes = require('./routes/auctionRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const connectDB = require('./config/db.js');

// Connect to DB before server starts
connectDB();

app.use(cors()); //cross platform resourse sharing
app.use(express.json());

app.use(express.static('public')); //frontend


app.get('/', (req, res) => {
  res.send('Auction API is running');
});

app.use('/api/auctions', auctionRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/auth', require('./routes/authRoutes.js'));

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});



