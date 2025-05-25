const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://www.tapology.com";

const fetchUpcomingEvents = async () => {
  const url = `${baseUrl}/fightcenter?group=major&schedule=upcoming`;

  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const events = $(".fightcenterEvents > div")
    .toArray()
    .map((el) => {
      const eventLink = $(el).find(".promotion a");
      const title = eventLink.first().text().trim();
      const link = baseUrl + eventLink.first().attr("href");

      const date = $(el).find(".promotion span").eq(3).text().trim();
      const orgImage = $(el).find("img[alt]").attr("src") || null;

      const geo = $(el).find(".geography");
      const sport = geo.find("span.sport").text().trim();
      const location =
        geo.find("span.hidden.md\\:inline").text().trim() ||
        geo.find("span.inline.md\\:hidden").text().trim();

      const watchInfo = $(el)
        .find("div.div.hidden.md\\:inline span")
        .last()
        .text()
        .trim();

      return {
        title,
        date,
        link,
        orgImage,
        sport,
        location,
        watch: watchInfo,
      };
    })
    .slice(0, 10);

  return events;
};

const fetchEventDetails = async (events) => {
  const detailed = await Promise.all(
    events.map(async (event) => {
      const { data: html } = await axios.get(event.link);
      const $ = cheerio.load(html);

      const fights = $('ul[data-event-view-toggle-target="list"] li')
        .toArray()
        .map((el) => {
          const main = $(el).find("a").text().toLowerCase().includes("main");
          const weight = $(el)
            .find(
              "span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded"
            )
            .text()
            .trim()
            .substring(0, 3);

          const fighterContainers = $(el).find(
            ".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full"
          );

          const parseFighter = (container) => ({
            name: container.find(".link-primary-red").text().trim(),
            record: container
              .find(".text-\\[15px\\].md\\:text-xs")
              .text()
              .trim(),
            country:
              baseUrl + container.find(".opacity-70.h-\\[14px\\]").attr("src"),
            picture: container.find(".rounded").attr("src"),
            link: baseUrl + container.find(".link-primary-red").attr("href"),
          });

          const fighterA = parseFighter(fighterContainers.eq(0));
          const fighterB = parseFighter(fighterContainers.eq(1));

          return { main, weight, fighterA, fighterB };
        });

      return { ...event, fights };
    })
  );

  return detailed.filter((event) => event.fights.length > 0);
};

module.exports = async (req, res) => {
  try {
    const events = await fetchUpcomingEvents();
    const detailed = await fetchEventDetails(events);
    res.status(200).json(detailed);
  } catch (error) {
    console.error("Scrape error:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: error.message });
  }
};
