const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Hotel = require('../db');

(async () => {
  let browser;
  try {
    // Wait for DB (Mongoose buffers but let's be explicit)
    await mongoose.connection.asPromise();

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    console.log("✈️ SCRAPER: Navigating to Google Maps...");
    await page.goto('https://www.google.com/maps/search/hotels+in+rishikesh', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    // Wait for results panel
    await page.waitForSelector('.Nv2PK', { timeout: 20000 });

    // 🔽 Better scrolling (important)
    await autoScroll(page);

    const hotels = await page.evaluate(() => {
      const data = [];

      document.querySelectorAll('.Nv2PK').forEach(el => {
        const name = el.querySelector('.qBF1Pd')?.innerText || "";
        const rating = el.querySelector('.MW4etd')?.innerText || "0";
        const link = el.querySelector('a')?.href || "";

        // 🔥 Extract image from style (Google Maps trick)
        let image = "";
        const imgEl = el.querySelector('img');
        if (imgEl) image = imgEl.src;

        data.push({
          name,
          rating,
          link,
          image
        });
      });

      return data.slice(0, 50);
    });

    console.log(`✈️ SCRAPER: Found ${hotels.length} potential hotels. Storing...`);

    // Save to DB
    for (let h of hotels) {
      if (!h.name) continue;

      let price = Math.floor(Math.random() * 2000) + 300;
      let type = price < 800 ? "budget" : (price > 2000 ? "luxury" : "mid");
      let vibe = [];
      
      if (type === "budget" || h.name.toLowerCase().includes("hostel")) vibe.push("adventure", "budget");
      else if (type === "luxury" || h.name.toLowerCase().includes("resort") || h.name.toLowerCase().includes("spa")) vibe.push("luxury", "chill", "peace");
      else vibe.push("chill", "general");

      await Hotel.updateOne(
        { name: h.name },
        {
          name: h.name,
          city: "Rishikesh",
          rating: parseFloat(h.rating) || 0,
          image: h.image,
          link: h.link,
          price: price, // Simulated price (300 to 2300 INR)
          type: type,
          vibe: vibe,
          amenities: ["Free WiFi", "AC", "Breakfast"],
          sponsored: Math.random() > 0.8
        },
        { upsert: true }
      );
    }

    console.log(`✅ ${hotels.length} Hotels Stored for Rishikesh`);

  } catch (err) {
    console.error("❌ SCRAPER ERROR:", err.message);
  } finally {
    if (browser) await browser.close();
    await mongoose.disconnect();
    process.exit();
  }
})();


// 🔥 AUTO SCROLL FUNCTION (CRUCIAL)
async function autoScroll(page) {
  await page.evaluate(async () => {
    const scrollable = document.querySelector('div[role="feed"]');
    if (!scrollable) return;

    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 1000;

      const timer = setInterval(() => {
        scrollable.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= 20000) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  });
}