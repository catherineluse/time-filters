import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { Link, useHistory } from "react-router-dom";
const { DateTime } = require("luxon");

const dateRangeTypes = {
  FUTURE: "FUTURE",
  PAST: "PAST",
  BETWEEN_TWO_DATETIMES: "BETWEEN_TWO_DATETIMES",
};

const AllEvents = () => {
  let history = useHistory();
  const now = DateTime.now();
  const nowISO = now.toISO();
  const futureEventsFilter = `gt: "${nowISO}"`;
  const pastEventsFilter = `lt: "${nowISO}"`;
  const defaultStartDateObj = now.startOf("day");
  const defaultStartDateISO = defaultStartDateObj.toISO();
  const defaultEndDateRangeObj = defaultStartDateObj.plus({ days: 30 });
  const defaultEndDateRangeISO = defaultEndDateRangeObj.toISO();

  const [dateRange, setDateRange] = useState(dateRangeTypes.FUTURE);
  const [startTimeFilter, setStartTimeFilter] = useState(futureEventsFilter);
  const [beginningOfDateRange, setBeginningOfDateRange] =
    useState(defaultStartDateISO);
  const [endOfDateRange, setEndOfDateRange] = useState(defaultEndDateRangeObj);
  const [limitResultsToOneDay, setLimitResultsToOneDay] = useState(false);

  // Can be used to get events in non-contiguous years.
  const [requireYears, setRequireYears] = useState(false);
  const [years, setYears] = useState({});

  // Get events from a specific month across multiple years,
  // or non-contiguous months, like April and June but not May.
  const [requireMonths, setRequireMonths] = useState(false);
  const [months, setMonths] = useState({});

  // Can be combined with month to get events that happen
  // on a certain day without specifying the year, or events
  // that happen on non-contiguous days.
  const [requireDaysOfMonth, setRequireDaysOfMonth] = useState(false);
  const [daysOfMonth, setDaysOfMonth] = useState({});

  // Can be used to get events that happen on certain weekdays
  // across a longer time period, or across multiple
  // non-contiguous weekdays.
  const [requireWeekdays, setRequireWeekdays] = useState(false);
  const [weekdays, setWeekdays] = useState({});

  const [requireRangeOfHours, setRequireRangeOfHours] = useState(false);
  const [beginningOfHourRange, setBeginningOfHourRange] =
    useState(defaultStartDateISO);
  const [endOfHourRange, setEndOfHourRange] = useState(defaultEndDateRangeObj);

  const [requireAvailabilityWindows, setRequireAvailabilityWindows] =
    useState(false);
  const [availabilityWindows, setAvailabilityWindows] = useState({});

  const [resultsPerPage, setResultsPerPage] = useState(10);

  // Variables for the order of the results
  const chronologicalOrder = "{ asc: startTime }";
  const reverseChronologicalOrder = "{ desc: startTime }";

  const [resultsOrder, setResultsOrder] = useState(chronologicalOrder);

  const betweenDateTimesFilter = `between: { min: ${beginningOfDateRange}, max: ${endOfDateRange}}`;
  const certainYearsFilter = `startTimeYear: {anyofterms: "${Object.keys(
    years
  ).join(" ")}"}`;
  const certainMonthsFilter = `startTimeMonth: {anyofterms: "${Object.keys(
    months
  ).join("")}"}`;
  const certainDaysOfMonthFilter = `startTimeDayOfMonth: {anyofterms: "${Object.keys(
    daysOfMonth
  ).join("")}"}`;
  const certainWeekdaysFilter = `startTimeDayOfWeek: {anyofterms: "${weekdays}"}`;
  const certainRangeOfHoursFilter = `startTimeHourOfDay: {between: {min: ${beginningOfHourRange},max: ${endOfHourRange}}}}`;
  const availabilityWindowsFilter = () => {
    if (!availabilityWindows) {
      return "";
    }
    // assume availabilityWindows is in this format:
    //   {
    //       Monday: [{min: "1", max: "2"}, {min: "3", max: "6"}],
    //       Saturday: [{min: "8", max: "23"}]
    //   }
    let getTimeWindowStrings = () => {
      let timeWindowStrings = "";

      for (let day in availabilityWindows) {
        let timeWindows = availabilityWindows[day];

        let timeWindowString = timeWindows.map((timeWindow) => {
          let minTime = timeWindow.min;
          let maxTime = timeWindow.max;
          return `{startTimeDayOfWeek: {allofterms: ${day}},startTimeHourOfDay: {between: {min: ${minTime}, max: ${maxTime}}}},`;
        });
        timeWindowStrings.concat(timeWindowString);
      }
    };
    let windowsFilter = `or: [${getTimeWindowStrings()}]`;
    return windowsFilter;
  };

  const toggleRequireAvailabilityWindows = () => {
    if (requireAvailabilityWindows) {
      setRequireYears(true);
      setRequireMonths(true);
      setRequireDaysOfMonth(true);
      setRequireWeekdays(true);
      setRequireRangeOfHours(true);
      setRequireAvailabilityWindows(false);
    } else {
      setRequireYears(false);
      setRequireMonths(false);
      setRequireDaysOfMonth(false);
      setRequireWeekdays(false);
      setRequireRangeOfHours(false);
      setRequireAvailabilityWindows(true);
    }
  };

  const buildEventFilters = () => {
    let eventFilterString = `(
          order: ${resultsOrder},
          first: ${resultsPerPage},
          filter: {
            startTime: {
                ${startTimeFilter}
            },
            ${requireYears ? certainYearsFilter : ""}
            ${requireMonths ? certainMonthsFilter : ""}
            ${requireDaysOfMonth ? certainDaysOfMonthFilter : ""}
            ${requireWeekdays ? certainWeekdaysFilter : ""}
            ${requireRangeOfHours ? certainRangeOfHoursFilter : ""}
            ${requireAvailabilityWindows ? availabilityWindowsFilter() : ""}
          }
        )`;
    return eventFilterString;
  };
  console.log(buildEventFilters());

  let eventFilters = buildEventFilters();

  const useChronologicalOrder = () => {
    setResultsOrder(chronologicalOrder);
  };

  const useReverseChronologicalOrder = () => {
    setResultsOrder(reverseChronologicalOrder);
  };

  const showPastEvents = () => {
    setStartTimeFilter(pastEventsFilter);
  };

  const showFutureEvents = () => {
    setStartTimeFilter(futureEventsFilter);
  };

  const showEventsBetweenTwoDates = () => {
    setStartTimeFilter(betweenDateTimesFilter);
  };

  let GET_EVENTS = gql`
  query getEvents {
    queryEvent${eventFilters}{
      id
      title
      startTime
    }
  }
  `;

  const { loading, error, data, refetch } = useQuery(GET_EVENTS);

  useEffect(() => {
    // when limitResultsToOneDay is true,
    // update the beginning and end date range
  }, [limitResultsToOneDay]);

  useEffect(() => {
    if (dateRange === dateRangeTypes.FUTURE) {
      setResultsOrder(chronologicalOrder);
      showFutureEvents();
    }
    if (dateRange === dateRangeTypes.PAST) {
      setResultsOrder(reverseChronologicalOrder);
      showPastEvents();
    }
    if (dateRange === dateRangeTypes.BETWEEN_TWO_DATES) {
      setResultsOrder(chronologicalOrder);
      showEventsBetweenTwoDates();
    }
    refetch();
  }, [
    dateRange,
  ]);

  // The more complex date filters are within
  // this useEffect. For example, with these you can:

  // - Get events with a certain day and month, but
  // in any year.
  // - Get all events on certain
  // weekdays within a certain range of hours.
  // - Get all events in a selection of multiple
  // non-contiguous days, months or years. For example,
  // get events from 2012 and 2014, but not 2013.
  useEffect(() => {
    refetch();
  }, [
    years,
    months,
    daysOfMonth,
    weekdays,
    beginningOfHourRange,
    endOfHourRange,
  ]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{`GET_EVENTS error: ${error}`}</p>;
  }

  if (data && data.queryEvent) {
    const Events = data.queryEvent;
    if (Events.length === 0) {
      return <p>There are no events yet.</p>;
    }

    const renderEventList = () => {
      return Events.map((event, i) => {
        const { id, title, startTime } = event;

        const startTimeObj = DateTime.fromISO(startTime);

        const getDatePieces = () => {
          const timeOfDay = startTimeObj.toLocaleString(DateTime.TIME_SIMPLE);
          const zone = startTimeObj.zoneName;
          const weekday = startTimeObj.weekdayLong;
          const month = startTimeObj.monthLong;
          const day = startTimeObj.day;

          return {
            timeOfDay,
            zone,
            weekday,
            month,
            day,
          };
        };
        const { timeOfDay, zone, weekday, month, day } = getDatePieces();

        const handleClick = () => history.push(`/event/${id}`);

        let showDayHeader = false;

        // This is a temporary value. We change it
        // if a previous start time exists, allowing
        // us to check if the current event is on the
        // same day as the previous event in the list.
        let prevStartTimeObj = null;

        if (i > 0) {
          const prevEvent = Events[i - 1];
          const prevStartTime = prevEvent.startTime;
          prevStartTimeObj = DateTime.fromISO(prevStartTime);
        }

        // If the start time of the event is the first
        // event in the list, or if it is on a different day
        // than the previous event in the list, add a header
        // with the day of the event. This is useful
        // for conveying a visual hierarchy so that events on
        // the same day are clearly shown as being on
        // the same day.
        if (
          i === 0 ||
          !startTimeObj.startOf("day").equals(prevStartTimeObj.startOf("day"))
        ) {
          showDayHeader = true;
        }

        return (
          <div className="eventListItem" key={id}>
            <div className="row">
              {showDayHeader ? (
                <div className="eventListHeader">{`${weekday}, ${month} ${day}`}</div>
              ) : null}
            </div>
            <div className="row">
              <div className="col col-sm-3 event-date">
                <div>{timeOfDay}</div>
              </div>

              <div className="col">
                <div className="event-title" onClick={handleClick}>
                  {title}
                </div>
                <div className="event-details">
                  Time Zone: {zone ? zone : null}
                </div>
                <div className="event-details">
                  <Link className="understatedLink" to={`/event/${id}`}>
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      }); // end eventsToRender.map()
    }; // end renderEventList
    return (
      <div className="container">
        <h1>All Events</h1>
        <p>Build event filters returns:</p>
        {buildEventFilters()}
        {renderEventList()}
      </div>
    );
  } // end if (data && data.queryEvent)
}; //AllEvents

export default AllEvents;
