const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://www.tapology.com";
const majorOrgs = ["UFC", "PFL", "BELLATOR", "ONE", "RIZIN"];

const fetchUpcomingEvents = async () => {
  const url = `${baseUrl}/fightcenter?group=major&schedule=upcoming`;

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });
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
      .filter((event) => {
        const title = event.title.toUpperCase();
        return (
          majorOrgs.some((org) => title.includes(org)) &&
          !title.includes("ONE FRIDAY FIGHTS")
        );
      })
      .slice(0, 20);

    return events;
  } catch (error) {
    console.error("Error fetching events:", error.message);
    throw error;
  }
};

const fetchEventDetails = async (events) => {
  try {
    const eventsWithFights = await Promise.all(
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

            const fighterAContainer = fighterContainers.eq(0);
            const fighterA = {
              name: fighterAContainer.find(".link-primary-red").text().trim(),
              record: fighterAContainer
                .find(".text-\\[15px\\].md\\:text-xs.order-2")
                .text()
                .trim(),
              country:
                baseUrl +
                fighterAContainer
                  .find(
                    ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
                  )
                  .attr("src"),
              picture: fighterAContainer
                .find(
                  ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                )
                .attr("src"),
              link:
                baseUrl +
                fighterAContainer.find(".link-primary-red").attr("href"),
            };

            const fighterBContainer = fighterContainers.eq(1);
            const fighterB = {
              name: fighterBContainer.find(".link-primary-red").text().trim(),
              record: fighterBContainer
                .find(".text-\\[15px\\].md\\:text-xs.order-1")
                .text()
                .trim(),
              country:
                baseUrl +
                fighterBContainer
                  .find(
                    ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
                  )
                  .attr("src"),
              picture: fighterBContainer
                .find(
                  ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                )
                .attr("src"),
              link:
                baseUrl +
                fighterBContainer.find(".link-primary-red").attr("href"),
            };

            return { main, weight, fighterA, fighterB };
          });

        return { ...event, fights };
      })
    );

    return eventsWithFights.filter((event) => event.fights.length > 0);
  } catch (error) {
    console.error("Error fetching event details:", error.message);
    throw error;
  }
};

module.exports = {
  fetchUpcomingEvents,
  fetchEventDetails,
};
