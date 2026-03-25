require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Hotel = require('./db');
const rankHotels = require('./utils/ranking');

const app = express();
app.use(cors());
app.use(express.json());

const { scrapeCity } = require('./utils/dynamicScraper');

// 🏨 Premium Hotel Discovery API
app.get('/hotels', async (req, res) => {
  // Support both 'place' and 'city' query parameters for backward compatibility
  const place = req.query.place || req.query.city;
  const budgetStr = req.query.budget;
  const query = req.query.query; 

  if (!place) {
    return res.status(400).json({ error: "Place parameter is required" });
  }

  let budget = null;
  try {
    if (budgetStr && budgetStr !== "null") budget = JSON.parse(budgetStr);
  } catch(e) {}

  try {
    const cleanPlace = place.trim().toLowerCase();
    const escapedPlace = cleanPlace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const placeRegex = new RegExp(`^${escapedPlace}$`, 'i');
    
    // ✅ 1. CHECK DB FIRST
    let hotels = await Hotel.find({ city: placeRegex }).lean();

    if (hotels.length > 0) {
      // ✅ Apply budget filter on DB data
      if (budget) {
        hotels = hotels.filter(h => h.price <= budget.max + 500);
      }
      return res.json(hotels.length ? rankHotels(hotels, query || "") : []);
    }

    // 🔥 2. SCRAPE IF EMPTY
    console.log(`🔍 Live Scraping starting for ${place} with budget`, budget);

    const scraped = await scrapeCity(place, budget);

    // ✅ SAVE
    if (scraped.length > 0) {
      await Hotel.insertMany(
        scraped.map(h => ({
          ...h,
          city: cleanPlace.charAt(0).toUpperCase() + cleanPlace.slice(1),
          address: h.address || `${cleanPlace}, India`
        }))
      );
    }

    return res.json(scraped.length ? rankHotels(scraped, query || "") : []);

  } catch (err) {
    console.error("⛔ Travel API error:", err);
    res.status(500).json({ error: "Discovery service failed or timed out" });
  }
});

// 🚣 Activities API (Rishikesh USP)
app.get('/activities', (req, res) => {
  const city = req.query.city;
  if (!city) return res.json([]);

  if (city.toLowerCase().includes("rishikesh")) {
    return res.json([
      {
        name: "River Rafting",
        price: 1200,
        image: "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&q=80&w=600",
        type: "Adventure"
      },
      {
        name: "Bungee Jumping",
        price: 3500,
        image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=600",
        type: "Extreme"
      },
      {
        name: "Camping by Ganga",
        price: 1500,
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600",
        type: "Relaxation"
      }
    ]);
  }
  res.json([]);
});

// ✅ Dynamic Port for Render Deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✈️ NovaX Travel Engine live on port ${PORT}`);
});
