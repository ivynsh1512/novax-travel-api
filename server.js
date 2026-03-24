const express = require('express');
const cors = require('cors');
const Hotel = require('./db');
const rankHotels = require('./utils/ranking');

const app = express();
app.use(cors());
app.use(express.json());

// 🏨 Premium Hotel Discovery API
app.get('/hotels', async (req, res) => {
  const { city, query } = req.query;

  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  try {
    // 1. Fetch matching city results
    const hotels = await Hotel.find({ city: new RegExp(city, 'i') });

    if (!hotels.length) {
      console.log(`🔎 No hotels found in ${city}`);
      return res.json([]);
    }

    // 2. Rank based on user intent (budget/luxury)
    const rankedHotels = rankHotels(hotels, query || "");

    // 3. Return top 10 specialized recommendations
    res.json(rankedHotels.slice(0, 10));
    
  } catch (err) {
    console.error("⛔ Travel API error:", err);
    res.status(500).json({ error: "Discovery service temporarily unavailable" });
  }
});

// ✅ Dynamic Port for Render Deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✈️ NovaX Travel Engine live on port ${PORT}`);
});
