const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Auction = require('../models/Auction');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find().populate('sellerId', 'username');

    // Check for expired auctions and close them "lazily"
    const now = new Date();
    let updated = false;

    for (const auction of auctions) {
      if (auction.isOpen && auction.endTime && new Date(auction.endTime) <= now) {
        auction.isOpen = false;

        // Find winner
        if (auction.bids.length > 0) {
          const sortedBids = auction.bids.sort((a, b) => b.amount - a.amount);
          const winningBid = sortedBids[0];

          // Populate winner details locally since we don't have full User object here, just ID ref
          // Note: In real app, might want to fetch User. But here ids are enough or we can rely on populate in next fetch
          // Let's keep it simple: We need to populate bids.userId to get username

          // To do this properly, let's re-fetch this specific auction with population OR just save ID and let frontend handle
          // But existing logic stores username in winner object.

          // Re-fetch to get bidder details
          // This is N+1 but acceptable for small scale lazy load
          const detailedAuction = await Auction.findById(auction._id).populate('bids.userId');
          const detailedSortedBids = detailedAuction.bids.sort((a, b) => b.amount - a.amount);
          const detailedWinningBid = detailedSortedBids[0];

          auction.winner = {
            userId: detailedWinningBid.userId._id,
            username: detailedWinningBid.userId.username,
            amount: detailedWinningBid.amount
          };
        }

        await auction.save();
        updated = true;
      }
    }

    // Refetch if any updates happened to ensure latest state is returned
    // Or just return the list (modified in memory). 
    // Since we modified proper objects in array (mostly), let's just return updated list from DB to be safe and clean.
    if (updated) {
      const updatedAuctions = await Auction.find().populate('sellerId', 'username');
      return res.json(updatedAuctions);
    }

    res.json(auctions);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch auctions', error: err
    });
  }
});

// GET single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('sellerId', 'username')
      .populate('bids.userId', 'username');
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching auction', error: err });
  }
});

// CREATE auction
router.post('/create', authMiddleware, (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  console.log('Auction Create Request:', { body: req.body, files: req.files?.length });
  const { title, description, startPrice, endTime } = req.body;
  const { id, role } = req.user;

  if (role !== 'seller') {
    return res.status(403).json({ message: 'Only sellers can create auctions' });
  }

  try {
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newAuction = new Auction({
      title,
      description,
      startPrice,
      endTime,
      sellerId: id,
      images: images,
      image: images.length > 0 ? images[0] : null
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
    const highestBid = auction.bids.length > 0 ? Math.max(...auction.bids.map(b => b.amount)) : auction.startPrice;

    if (amount <= highestBid) {
      return res.status(400).json({ message: `Bid must be higher than current highest bid: Rs.${highestBid}` });
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
router.put('/:id/edit', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    if (auction.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    auction.title = req.body.title;
    auction.description = req.body.description;
    auction.startPrice = req.body.startPrice;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      auction.images = newImages;
      auction.image = newImages[0];
    }

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
