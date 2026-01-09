const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Auction = require('./models/Auction');
const User = require('./models/User');

const SECRET_KEY = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// Mock data
const mockSellerId = new mongoose.Types.ObjectId();
const mockEndTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Generate Token
        const token = jwt.sign({ id: mockSellerId, role: 'seller', username: 'test_seller' }, SECRET_KEY);

        // 2. Perform Fetch Request (simulating frontend)
        // We need to use dynamic import for node-fetch or just use built-in fetch if node 18+
        // Assuming node 18+ based on environment description usually being modern

        const response = await fetch('http://localhost:3000/api/auctions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Test Auction with Time',
                description: 'Testing end time persistence',
                startPrice: 100,
                endTime: mockEndTime.toISOString()
            })
        });

        const data = await response.json();
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', data);

        if (response.ok) {
            // 3. Verify in DB
            const savedAuction = await Auction.findById(data.auction._id);
            console.log('--- DB VERIFICATION ---');
            console.log('Saved EndTime:', savedAuction.endTime);
            console.log('Matches Input?', new Date(savedAuction.endTime).getTime() === mockEndTime.getTime());

            // Clean up
            await Auction.findByIdAndDelete(data.auction._id);
            console.log('Cleanup: Deleted test auction');
        } else {
            console.error('Failed to create auction via API');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
