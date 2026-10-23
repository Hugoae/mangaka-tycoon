import { weekToDate } from "@mangaka/core";
import { useTranslation } from "react-i18next";

import { monthName } from "../../i18n/month-name";
import { selectDispatch, selectLastEvents, selectWeek } from "../../store/selectors";
import { useGameStore } from "../../store/store-context";
import { HubScreen } from "./hub-screen";

/** Hub wired to the store and to i18n: reads the game, translates it, dispatches commands. */
export function ConnectedHub() {
  const { t, i18n } = useTranslation();
  const week = useGameStore(selectWeek);
  const lastEvents = useGameStore(selectLastEvents);
  const dispatch = useGameStore(selectDispatch);

  const date = weekToDate(week);
  const dateLabel = t("hub.date", {
    month: monthName(date.month, i18n.language),
    year: date.year,
    // The core counts from 0; players count from 1.
    week: date.weekOfMonth + 1,
  });

  return (
    <HubScreen
      dateLabel={dateLabel}
      nextWeekLabel={t("hub.nextWeek")}
      eventLogLabel={t("hub.eventLog")}
      eventMessages={lastEvents.map((event) => t(event.key, event.params))}
      onNextWeek={() => {
        dispatch({ kind: "advanceWeek" });
      }}
    />
  );
}
