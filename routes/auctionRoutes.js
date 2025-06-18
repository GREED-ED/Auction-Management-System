const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Auction = require('../models/Auction');

// GET all auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find().populate('sellerId', 'username');
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch auctions', error: err 
    });
  }
});

// CREATE auction
router.post('/create', authMiddleware, async (req, res) => {
  const { title, description, startPrice } = req.body;
  const { id, role } = req.user;

  if (role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers can create auctions'});
  }

  try {
    const newAuction = new Auction({
      title,
      description,
      startPrice,
      sellerId: id
    });

    await newAuction.save();
    res.status(201).json({ 
      message: 'Auction created', 
      auction: newAuction 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Auction creation failed', error: err 
    });
  }
});

// Place a bid 
router.post('/:id/bid', authMiddleware, async (req, res) => {
  const auctionId = req.params.id;
  const { amount } = req.body;
  const { id: userId, role } = req.user; //extract garna lai

  if (role !== 'bidder') {
    return res.status(403).json({ message: 'Only bidders can place bids' });
  }

  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) 
      return res.status(404).json({ message: 'Auction not found' });
    if (!auction.isOpen) 
      return res.status(400).json({ message: 'Auction is closed' });

    // Get highest bid (if any)
    const highestBid = auction.bids.length > 0 ? Math.max(...auction.bids.map(b => b.amount)): auction.startPrice;

    if (amount <= highestBid) {
      return res.status(400).json({ message: `Bid must be higher than current highest bid: ${highestBid}` });
    }

    // Add new bid
    auction.bids.push({
      userId,
      amount,
      time: new Date()
    });

    await auction.save();

    res.status(200).json({ message: 'Bid placed', currentBid: amount });
  } catch (err) {
    res.status(500).json({ message: 'Bidding failed', error: err });
  }
});

// PUT /api/auctions/:id/edit
router.put('/:id/edit', authMiddleware, async (req, res) => {
try{
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  if (auction.sellerId.toString() !== req.user.id)
    return res.status(403).json({ message: 'Unauthorized' });

  auction.title = req.body.title;
  auction.description = req.body.description;
  auction.startPrice = req.body.startPrice;

  await auction.save();
  res.json(auction);
} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}
});

// DELETE /api/auctions/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    if (auction.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this auction' });
    }

    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Auction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




// Close auction and determine winner
router.put('/:id/close', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  const auctionId = req.params.id;

  try {
    const auction = await Auction.findById(auctionId).populate('bids.userId', 'username');

    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (!auction.isOpen) return res.status(400).json({ message: 'Auction already closed' });

    // Only the seller who created it OR admin can close
    if (role !== 'admin' && String(auction.sellerId) !== userId) {
      return res.status(403).json({ message: 'Unauthorized to close this auction' });
    }

    auction.isOpen = false;

    // Determine highest bidder (if any)
    if (auction.bids.length > 0) {
      const sortedBids = auction.bids.sort((a, b) => b.amount - a.amount);
      const winningBid = sortedBids[0];

      auction.winner = {
        userId: winningBid.userId._id,
        username: winningBid.userId.username,
        amount: winningBid.amount
      };
    }

    await auction.save();

    res.json({
      message: 'Auction closed',
      winner: auction.winner || 'No bids placed'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to close auction', error: err });
  }
});

module.exports = router;
