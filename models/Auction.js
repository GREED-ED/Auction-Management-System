const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: String,  
  description: String,
  startPrice: Number,
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  bids: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    amount: Number,
    time: { type: Date, default: Date.now }
  }],
  isOpen: { 
    type: Boolean,
    default: true 
  },
  winner: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    username: String,
    amount: Number
  }
  
});


module.exports = mongoose.model('Auction', auctionSchema);
