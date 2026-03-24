const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novax_travel';

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB for Travel Engine"))
  .catch(err => console.error("Travel DB connection error:", err));

const hotelSchema = new mongoose.Schema({
  name: String,
  city: String,
  rating: Number,
  price: Number,
  link: String,
  image: String,
  tags: [String],
  sponsored: { type: Boolean, default: false }
});

module.exports = mongoose.model('Hotel', hotelSchema);
