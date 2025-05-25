const express = require("express");
const cors = require("cors");
const {
  fetchUpcomingEvents,
  fetchEventDetails,
} = require("./scrapers/tapology");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const { isCacheFresh, readCache, writeCache } = require("./utils/cache");

app.get("/api/events", async (req, res) => {
  const forceRefresh = req.query.refresh === "true";

  try {
    if (!forceRefresh && isCacheFresh()) {
      const cachedData = readCache();
      if (cachedData) {
        return res.json(cachedData);
      }
    }

    const events = await fetchUpcomingEvents();
    const detailedEvents = await fetchEventDetails(events);

    writeCache(detailedEvents);
    res.json(detailedEvents);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
