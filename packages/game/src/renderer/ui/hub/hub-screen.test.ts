import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HubScreen } from "./hub-screen";
import type { HubScreenProps } from "./hub-screen";

const props: HubScreenProps = {
  dateLabel: "Janvier 1980 · semaine 1",
  nextWeekLabel: "Semaine suivante",
  eventLogLabel: "Journal",
  eventMessages: ["Une nouvelle semaine commence."],
  onNextWeek: () => undefined,
};

describe("HubScreen", () => {
  it("shows the date, the button and the event messages it is given", () => {
    const html = renderToStaticMarkup(createElement(HubScreen, props));

    expect(html).toContain("Janvier 1980 · semaine 1");
    expect(html).toContain("Semaine suivante");
    expect(html).toContain("Une nouvelle semaine commence.");
  });

  it("renders a real button that does not submit anything", () => {
    const html = renderToStaticMarkup(createElement(HubScreen, props));

    expect(html).toMatch(/<button[^>]*type="button"/);
  });

  it("renders an empty log when there is no event", () => {
    const html = renderToStaticMarkup(createElement(HubScreen, { ...props, eventMessages: [] }));

    expect(html).not.toContain("<li");
  });

  it("escapes text instead of interpreting it as markup", () => {
    const html = renderToStaticMarkup(
      createElement(HubScreen, { ...props, eventMessages: ["<img src=x>"] }),
    );

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
