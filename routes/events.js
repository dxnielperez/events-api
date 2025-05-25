const express = require("express");
const router = express.Router();
const {
  fetchUpcomingEvents,
  fetchEventDetails,
} = require("../scrapers/tapology");

// Basic route example
router.get("/", async (req, res) => {
  try {
    const events = await fetchUpcomingEvents();
    const detailedEvents = await fetchEventDetails(events);
    res.json(detailedEvents);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: error.message });
  }
});

module.exports = router;
