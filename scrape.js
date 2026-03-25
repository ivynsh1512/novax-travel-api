const axios = require("axios");
const mongoose = require("mongoose");
const Hotel = require("./db");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novax_travel";

mongoose.connect(MONGO_URI)
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

async function scrape() {
    try {
        // 🔥 This endpoint mimics Google results (no JS issue)
        const url = "https://serpapi.com/search.json?q=hotels+in+rishikesh&engine=google&api_key=demo";

        const res = await axios.get(url);
        const data = res.data;

        const hotels = [];

        const results = data.local_results || [];

        results.forEach(h => {
            hotels.push({
                name: h.title,
                city: "Rishikesh",
                rating: h.rating || 4,
                price: Math.floor(Math.random() * 3000) + 1000,
                address: h.address || "Rishikesh",
                image: h.thumbnail || "",
                link: h.link || "",
                highlights: ["Popular", "Good Location"]
            });
        });

        console.log(`✈️ SEARCH: Found ${results.length} results. Syncing to DB...`);

        for (let h of results) {
            let price = h.price ? parseInt(h.price.replace(/[^0-9]/g, '')) : Math.floor(Math.random() * 2000) + 300;
            let type = price < 800 ? "budget" : (price > 2000 ? "luxury" : "mid");
            let vibe = [];
            
            if (type === "budget" || h.title.toLowerCase().includes("hostel")) vibe.push("adventure", "budget");
            else if (type === "luxury" || h.title.toLowerCase().includes("resort")) vibe.push("luxury", "chill", "peace");
            else vibe.push("chill", "general");

            await Hotel.updateOne(
                { name: h.title },
                {
                    name: h.title,
                    city: "Rishikesh",
                    rating: h.rating || 4.2,
                    price: price,
                    address: h.address || "Rishikesh, India",
                    image: h.thumbnail || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600",
                    link: h.link || "#",
                    highlights: ["Live Results", "Scenic View", "Top Rated"],
                    amenities: ["Free WiFi", "AC", "Breakfast"],
                    type: type,
                    vibe: vibe,
                    sponsored: Math.random() > 0.8
                },
                { upsert: true }
            );
        }

        console.log(`✅ Synced ${results.length} hotels successfully`);
        process.exit(0);

    } catch (err) {
        console.error("❌ SCRAPE ERROR:", err.message);
        process.exit(1);
    }
}

scrape();