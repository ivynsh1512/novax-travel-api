function rankHotels(hotels, query = "") {
  const q = query.toLowerCase();

  return hotels
    .map(h => {
      const price = Number(h.price) || 5000;
      const rating = Number(h.rating) || 0;

      let score = 0;

      // ⭐ Sponsored boost (monetization)
      if (h.sponsored) score += 100;

      // ⭐ Organic rating weight
      score += rating * 20;

      // 💰 Query-based alignment
      if (q.includes("cheap") || q.includes("budget")) {
        score += Math.max(0, 50 - price / 100);
      } else if (q.includes("luxury") || q.includes("premium")) {
        score += price / 100;
      } else {
        score += 20;
      }

      return { ...h, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

module.exports = rankHotels;
