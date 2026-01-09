const mongoose = require('mongoose');
const Auction = require('./models/Auction');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');
        const auctions = await Auction.find({});
        console.log('--- AUCTIONS ---');
        auctions.forEach(a => {
            console.log(`ID: ${a._id}`);
            console.log(`Title: ${a.title}`);
            console.log(`EndTime: ${a.endTime} (Type: ${typeof a.endTime})`);
            console.log(`IsOpen: ${a.isOpen}`);
            console.log('----------------');
        });
        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
