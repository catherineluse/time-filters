import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { Link, useHistory } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import { KeyboardDatePicker } from "@material-ui/pickers";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import { Form as BootstrapForm } from "react-bootstrap";
import {
  years,
  months,
  daysOfTheMonth,
  weekdays,
  hourRangesData,
} from "./eventSearchOptions";

const { DateTime } = require("luxon");

const dateRangeTypes = {
  FUTURE: "FUTURE",
  PAST: "PAST",
  BETWEEN_TWO_DATES: "BETWEEN_TWO_DATES",
  CERTAIN_DATE: "CERTAIN_DATE",
};

const AllEvents = () => {
  const history = useHistory();
  const now = DateTime.now();
  const currentYear = now.year;
  const nowISO = now.toISO();
  const futureEventsFilter = `gt: "${nowISO}"`;
  const pastEventsFilter = `lt: "${nowISO}"`;

  const defaultStartDateObj = now.startOf("day");
  const defaultStartDateISO = defaultStartDateObj.toISO();
  const defaultEndOfStartDayObj = defaultStartDateObj.endOf("day");
  const defaultEndOfStartDayISO = defaultEndOfStartDayObj.toISO();
  const defaultEndDateRangeObj = defaultStartDateObj.plus({ days: 30 });
  const defaultEndDateRangeISO = defaultEndDateRangeObj.toISO();

  const [dateRange, setDateRange] = useState(dateRangeTypes.FUTURE);
  const [startTimeFilter, setStartTimeFilter] = useState(futureEventsFilter);
  const [beginningOfDateRange, setBeginningOfDateRange] =
    useState(defaultStartDateISO);
  const [endOfDateRange, setEndOfDateRange] = useState(defaultEndDateRangeISO);

  const [startOfCertainDay, setStartOfCertainDay] =
    useState(defaultStartDateISO);
  const [endOfCertainDay, setEndOfCertainDay] = useState(
    defaultEndOfStartDayISO
  );

  // Can be used to get events in non-contiguous years.
  const [selectedYears, setSelectedYears] = useState([]);

  // Get events from a specific month across multiple years,
  // or non-contiguous months, like April and June but not May.
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Can be combined with month to get events that happen
  // on a certain day without specifying the year, or events
  // that happen on non-contiguous days.
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState([]);

  const [selectedHourRanges, setSelectedHourRanges] = useState([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [selectedWeeklyHourRanges, setSelectedWeeklyHourRanges] = useState({});

  // Variables for the order of the results
  const chronologicalOrder = "{ asc: startTime }";
  const reverseChronologicalOrder = "{ desc: startTime }";

  const [resultsOrder, setResultsOrder] = useState(chronologicalOrder);

  const betweenDateTimesFilter = `between: { min: "${beginningOfDateRange}", max: "${endOfDateRange}"}`;
  const certainDayFilter = `between: {min: "${startOfCertainDay}", max: "${endOfCertainDay}"}`;
  const certainYearsFilter = `startTimeYear: {anyofterms: "${selectedYears.join(
    " "
  )}"}`;
  const certainMonthsFilter = `startTimeMonth: {anyofterms: "${selectedMonths
    .map((e) => e.number)
    .join(" ")}"}`;
  const certainDaysOfMonthFilter = `startTimeDayOfMonth: {anyofterms: "${selectedDaysOfMonth.join(
    " "
  )}"}`;

  const getWeeklyTimeRangeFilter = () => {
    // The selected weekly time windows are in the
    // piece of state called selectedWeeklyHourRanges.
    // That data structure is an object where the keys
    // are weekdays and the values are times of day.
    // But to create a GraphQL query filter out of that,
    // this function flattens the structure so that the
    // filter will look something like this:

    // and: {
    //   or: [
    //   {
    //     startTimeHourOfDay: {
    //         between: {
    //           min: 3,
    //           max: 6
    //         }
    //     },
    //     startTimeDayOfWeek: {
    //       allofterms: "Thursday"
    //     }
    //   },
    //   {
    //     startTimeHourOfDay: {
    //       between: {
    //         min: 0,
    //         max: 3
    //       }
    //     },
    //     startTimeDayOfWeek: {
    //       allofterms: "Friday"
    //     }
    //   }
    //   ]
    // }

    let weekdayNameArray = Object.keys(selectedWeeklyHourRanges);

    let weeklyTimeRangeObjects = weekdayNameArray
      .map((weekdayName) => {
        let timeRangeData = selectedWeeklyHourRanges[weekdayName];
        let hourRangeArray = Object.keys(timeRangeData);

        return hourRangeArray
          .map((hourRangeName) => {
            const max = timeRangeData[hourRangeName].max;
            const min = timeRangeData[hourRangeName].min;
            return `{startTimeHourOfDay: {between: {min: ${min}, max: ${max}}}, startTimeDayOfWeek: {allofterms: "${weekdayName}"}}`;
          })
          .join("");
      })
      .join("");

    let frame = `and: {or: [${weeklyTimeRangeObjects}]}`;
    return frame;
  };

  const weeklyTimeRangeFilter = getWeeklyTimeRangeFilter();

  const buildEventFilters = () => {
    let eventFilterString = `(
          order: ${resultsOrder},
          filter: {
            startTime: {
                ${startTimeFilter}
            },
            ${selectedYears.length ? certainYearsFilter : ""}
            ${selectedMonths.length > 0 ? certainMonthsFilter : ""}
            ${selectedDaysOfMonth.length > 0 ? certainDaysOfMonthFilter : ""}
            ${
              Object.keys(selectedWeeklyHourRanges).length > 0
                ? weeklyTimeRangeFilter
                : ""
            }
          }
        )`;
    return eventFilterString;
  };

  let eventFilters = buildEventFilters();

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

  // Use built-in DateTime date filters
  useEffect(() => {
    if (dateRange === dateRangeTypes.FUTURE) {
      setResultsOrder(chronologicalOrder);
      setStartTimeFilter(futureEventsFilter);
    }
    if (dateRange === dateRangeTypes.PAST) {
      setResultsOrder(reverseChronologicalOrder);
      setStartTimeFilter(pastEventsFilter);
    }
    if (dateRange === dateRangeTypes.BETWEEN_TWO_DATES) {
      setResultsOrder(chronologicalOrder);
      setStartTimeFilter(betweenDateTimesFilter);
    }
    if (dateRange === dateRangeTypes.CERTAIN_DATE) {
      setResultsOrder(chronologicalOrder);
      setStartTimeFilter(certainDayFilter);
    }
    refetch();
  }, [dateRange, startOfCertainDay, beginningOfDateRange, endOfDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // The more complex date filters are used by
  // this useEffect hook. For example, with these you can:
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
    selectedYears,
    selectedMonths,
    selectedDaysOfMonth,
    selectedWeeklyHourRanges,
    refetch,
  ]);

  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  const weeklyTimeRangeIsAlreadySelected = (dayNumber, timeRange) => {
    if (dayNumber in selectedWeeklyHourRanges) {
      let selectedHourRangesOnDay = selectedWeeklyHourRanges[dayNumber];

      if (timeRange in selectedHourRangesOnDay) {
        return true;
      }
    }
    return false;
  };

  // This function makes it so that when an
  // entire weekday column
  // is selected with a checkbox in the form
  // for selecting availability windows, it applies
  // the weekday filter.
  const toggleSelectWeekday = (day) => {
    console.log({selectedWeekdays, day})
    const removeWeekday = () => {
      setSelectedWeekdays(
        selectedWeekdays.filter((weekdayNumber) => weekdayNumber !== day.number)
      );
      let newSelectedWeeklyHourRanges = { ...selectedWeeklyHourRanges };
      delete newSelectedWeeklyHourRanges[day.number];
      setSelectedWeeklyHourRanges(newSelectedWeeklyHourRanges);
    };

    const addWeekday = () => {
      if (selectedWeekdays.indexOf(day.number) === -1) {
        console.log('i ran')
        const newWeekdays = [...selectedWeekdays, day.number];
        setSelectedWeekdays(newWeekdays);
      }

      // When selecting a weekday, first clear out all the
      // individual time filters inside it.
      // Then just add all the time ranges for that day.
      // If you're wondering why we don't filter for a weekday directly,
      // it's because if we filtered by a weekday and combined it
      // with a filter for other weekly windows of time, we would get
      // only results included in BOTH filters.
      let newSelectedWeeklyHourRanges = { ...selectedWeeklyHourRanges };
      newSelectedWeeklyHourRanges[day.number] = {};
      for (let i = 0; i < hourRangesData.length; i++) {
        let timeRange = hourRangesData[i];
        newSelectedWeeklyHourRanges[day.number][timeRange["12-hour-label"]] = {
          max: timeRange.max,
          min: timeRange.min,
        };
      }
      setSelectedWeeklyHourRanges(newSelectedWeeklyHourRanges);
    };

    if (selectedWeekdays.indexOf(day.number) !== -1) {
      removeWeekday();
    } else {
      addWeekday();
    }
  };

  // This function makes it so that when an
  // entire time range range row is selected with
  // a checkbox in the form for selecting
  // availability windows, it applies to the
  // time range filter.
  const toggleSelectTimeRange = (timeRange) => {
    const removeTimeRange = () => {
      const newSelectedWeeklyHourRanges = { ...selectedWeeklyHourRanges };

      for (let weekday in newSelectedWeeklyHourRanges) {
        // existing time ranges are in the form of an object
        // in which the key is the time in 12-hour format.

        if (newSelectedWeeklyHourRanges[weekday][timeRange["12-hour-label"]]) {
          delete newSelectedWeeklyHourRanges[weekday][
            timeRange["12-hour-label"]
          ];

          if (Object.keys(newSelectedWeeklyHourRanges[weekday]).length === 0) {
            console.log("i ran");
            delete newSelectedWeeklyHourRanges[weekday];
          }
        }
      }
      setSelectedWeeklyHourRanges(newSelectedWeeklyHourRanges);

      const newHourRanges = selectedHourRanges.filter(
        (e) => e !== timeRange["12-hour-label"]
      );
      setSelectedHourRanges(newHourRanges);
    };

    const addTimeRange = () => {
      const newSelectedWeeklyHourRanges = { ...selectedWeeklyHourRanges };

      // Add the time range for every day of the week.
      // If you're wondering why we don't filter for a time range directly,
      // it's because if we filtered by an hour range and combined it
      // with a filter for other weekly windows of time, we would get
      // only results included in BOTH filters.

      for (let i = 0; i < weekdays.length; i++) {
        let weekdayName = weekdays[i].name;

        if (newSelectedWeeklyHourRanges[weekdayName]) {
          // If there is already an entry for the weekday,
          // avoid overWriting existing data.
          const existingTimesForWeekday =
            newSelectedWeeklyHourRanges[weekdayName];
          newSelectedWeeklyHourRanges[weekdayName] = {
            ...existingTimesForWeekday,
          };
          newSelectedWeeklyHourRanges[weekdayName][timeRange["12-hour-label"]] =
            { max: timeRange.max, min: timeRange.min };
        } else {
          // If there are no entries for the weekday yet,
          // add a new one with the given time range.
          newSelectedWeeklyHourRanges[weekdayName] = {};
          console.log({ weekdayName, timeRange });
          newSelectedWeeklyHourRanges[weekdayName][timeRange["12-hour-label"]] =
            {
              max: timeRange.max,
              min: timeRange.min,
            };
        }
      }
      setSelectedHourRanges([
        ...selectedHourRanges,
        timeRange["12-hour-label"],
      ]);
      setSelectedWeeklyHourRanges({
        ...newSelectedWeeklyHourRanges,
      });
    };

    if (selectedHourRanges.indexOf(timeRange["12-hour-label"]) !== -1) {
      removeTimeRange();
    } else {
      addTimeRange();
    }
  };

  // This function selects time ranges based on the
  // check boxes in individual table cells where each
  // row is a time range and each column is a weekday.
  const toggleWeeklyTimeRange = (day, timeRange) => {
    // We keep track of the selected weekly time ranges
    // in an object data structure to prevent duplicates.
    const timeRangeName = timeRange["12-hour-label"];
    let newWeeklyHourRanges = { ...selectedWeeklyHourRanges };

    const selectTimeRange = () => {
      // If there is no entry for the selected weekday yet,
      // add it first, then add the entry for the time range.
      if (!(day in newWeeklyHourRanges)) {
        newWeeklyHourRanges[day] = {};
        newWeeklyHourRanges[day][timeRangeName] = {
          min: timeRange.min,
          max: timeRange.max,
        };
        return;
      }
      // If there is already at least one hour range on the weekday
      // that is being toggled, but the specific time range isn't
      // selected yet, select it.
      newWeeklyHourRanges[day][timeRangeName] = {
        min: timeRange.min,
        max: timeRange.max,
      };
      setSelectedWeeklyHourRanges(newWeeklyHourRanges);
    };

    const deselectTimeRange = () => {
      delete newWeeklyHourRanges[day][timeRangeName];

      // If there are no other selected time ranges on the weekday,
      // also delete the selected weekday.
      if (Object.keys(newWeeklyHourRanges[day]).length === 0) {
        delete newWeeklyHourRanges[day];
      }
      setSelectedWeeklyHourRanges(newWeeklyHourRanges);
    };

    if (weeklyTimeRangeIsAlreadySelected(day, timeRangeName)) {
      deselectTimeRange();
    } else {
      selectTimeRange();
    }

    setSelectedWeeklyHourRanges(newWeeklyHourRanges);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{`GET_EVENTS error: ${error}`}</p>;
  }

  if (data && data.queryEvent) {
    const Events = data.queryEvent;

    const getTableRowItems = (hourRangeData) => {
      return weekdays.map((weekday) => {
        const getWeekdayIsSelected = () => {
          return selectedWeekdays.indexOf(weekday.number) !== -1;
        };

        const getHourRangeIsSelected = () => {
          return (
            selectedHourRanges.indexOf(hourRangeData["12-hour-label"]) !== -1
          );
        };

        const weekdayIsSelected = getWeekdayIsSelected();
        const hourRangeIsSelected = getHourRangeIsSelected();

        return (
          <td key={weekday.shortName}>
            <BootstrapForm.Check
              type="checkbox"
              disabled={weekdayIsSelected || hourRangeIsSelected}
              checked={
                weekdayIsSelected ||
                hourRangeIsSelected ||
                weeklyTimeRangeIsAlreadySelected(
                  weekday.number,
                  hourRangeData["12-hour-label"]
                )
              }
              onChange={() => {
                toggleWeeklyTimeRange(weekday.number, hourRangeData);
              }}
            />
          </td>
        );
      });
    };

    const renderEventList = () => {
      if (Events.length === 0) {
        return <p>There are no events yet.</p>;
      }
      return Events.map((event, i) => {
        const { id, title, startTime } = event;

        const startTimeObj = DateTime.fromISO(startTime);

        const getDatePieces = () => {
          const timeOfDay = startTimeObj.toLocaleString(DateTime.TIME_SIMPLE);
          const zone = startTimeObj.zoneName;
          const weekday = startTimeObj.weekdayLong;
          const month = startTimeObj.monthLong;
          const day = startTimeObj.day;
          const year = startTimeObj.year;

          return {
            timeOfDay,
            zone,
            weekday,
            month,
            day,
            year,
          };
        };
        const { timeOfDay, zone, weekday, month, day, year } = getDatePieces();

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
                <div className="eventListHeader">{`${weekday}, ${month} ${day}${
                  year !== currentYear ? ", " + year : ""
                }`}</div>
              ) : null}
            </div>
            <div className="row">
              <div className="col col-sm-3 event-date">
                <div>{timeOfDay}</div>
              </div>

              <div className="col">
                <div className="event-title" o>
                  {title}
                </div>
                <div className="event-details">
                  Time Zone: {zone ? zone : null}
                </div>
                <div className="event-details">
                  <Link className="understatedLink" to={`/event/${id}`}>
                    Details
                  </Link>
                  <Link className="understatedLink" to={`/edit-event/${id}`}>
                    Edit
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
        <Link className="understatedLink" to={"/create-event"}>
          Create event
        </Link>
        <div className="event-filters">
          <h2>
            <i className="fas fa-sort"></i> Normal Date Range Options
          </h2>
          <p>These options use normal Dgraph GraphQL DateTime filters.</p>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              value={dateRangeTypes.FUTURE}
              name="dateRangeType"
              id="dateRangeType1"
              checked={dateRange === dateRangeTypes.FUTURE}
              onChange={(e) => {
                setDateRange(e.target.value);
              }}
            />
            <label className="form-check-label">Show future events</label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              value={dateRangeTypes.PAST}
              name="dateRangeType"
              id="dateRangeType2"
              checked={dateRange === dateRangeTypes.PAST}
              onChange={(e) => {
                setDateRange(e.target.value);
              }}
            />
            <label className="form-check-label">Show past events</label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              value={dateRangeTypes.BETWEEN_TWO_DATES}
              name="dateRangeType"
              id="dateRangeType3"
              checked={dateRange === dateRangeTypes.BETWEEN_TWO_DATES}
              onChange={(e) => {
                setDateRange(e.target.value);
              }}
            />
            <label className="form-check-label">
              Show events between two dates
            </label>
          </div>
          {dateRange === dateRangeTypes.BETWEEN_TWO_DATES ? (
            <div className="date-pickers">
              <Grid container justify="flex-start">
                <KeyboardDatePicker
                  disableToolbar
                  variant="inline"
                  margin="normal"
                  format="cccc LLLL d"
                  label="From"
                  value={beginningOfDateRange}
                  onChange={(newStartDateObj) => {
                    const newStartDateISO = newStartDateObj.toISO();
                    setBeginningOfDateRange(newStartDateISO);
                  }}
                />
                <KeyboardDatePicker
                  disableToolbar
                  variant="inline"
                  margin="normal"
                  format="cccc LLLL d"
                  label="To"
                  value={endOfDateRange}
                  onChange={(newEndDateObj) => {
                    const newEndDateISO = newEndDateObj.toISO();
                    setEndOfDateRange(newEndDateISO);
                  }}
                />
              </Grid>
            </div>
          ) : null}
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              value={dateRangeTypes.CERTAIN_DATE}
              name="dateRangeType"
              id="dateRangeType4"
              checked={dateRange === dateRangeTypes.CERTAIN_DATE}
              onChange={(e) => {
                setDateRange(e.target.value);
              }}
            />
            <label className="form-check-label">
              Show events on a certain date
            </label>
          </div>
          {dateRange === dateRangeTypes.CERTAIN_DATE ? (
            <div className="date-pickers">
              <KeyboardDatePicker
                disableToolbar
                variant="inline"
                margin="normal"
                format="cccc LLLL d"
                label="Show events on this date"
                value={startOfCertainDay}
                onChange={(dateObj) => {
                  const startOfDayObj = dateObj.startOf("day");
                  const startOfDayISO = startOfDayObj.toISO();
                  setStartOfCertainDay(startOfDayISO);
                  const endOfDayObj = dateObj.endOf("day");
                  const endOfDayISO = endOfDayObj.toISO();
                  setEndOfCertainDay(endOfDayISO);
                }}
              />
            </div>
          ) : null}
          <h2>
            <i className="fas fa-sort"></i> Advanced Date Range Options
          </h2>
          <p>
            These options can filter events by multiple windows of time with
            non-contiguous years, months, days, weekdays and hour ranges, which
            are not natively supported by Dgraph's DateTime filters.
          </p>
        </div>
        <p>Limit events to certain years:</p>
        <Autocomplete
          multiple
          id="select-years"
          options={years}
          disableCloseOnSelect
          getOptionLabel={(option) => option}
          value={selectedYears}
          onChange={(_, inputYears) => {
            setSelectedYears(inputYears);
          }}
          renderOption={(option, { selected }) => (
            <React.Fragment>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option}
            </React.Fragment>
          )}
          style={{ width: 500 }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" placeholder="Years" />
          )}
        />
        <p>Limit events to certain months:</p>
        <Autocomplete
          multiple
          id="select-months"
          options={months}
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          value={selectedMonths}
          onChange={(_, inputMonths) => {
            setSelectedMonths(inputMonths);
          }}
          renderOption={(option, { selected }) => (
            <React.Fragment>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </React.Fragment>
          )}
          style={{ width: 500 }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" placeholder="Months" />
          )}
        />
        <p>Limit events to certain days of the month:</p>
        <Autocomplete
          multiple
          id="select-days-of-month"
          options={daysOfTheMonth}
          disableCloseOnSelect
          getOptionLabel={(option) => option}
          value={selectedDaysOfMonth}
          onChange={(_, inputDaysOfMonth) => {
            setSelectedDaysOfMonth(inputDaysOfMonth);
          }}
          renderOption={(option, { selected }) => (
            <React.Fragment>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option}
            </React.Fragment>
          )}
          style={{ width: 500 }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Days of the month"
            />
          )}
        />
        <p>Limit events to certain weekly time ranges:</p>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Time Range</th>
              {weekdays.map((weekday) => (
                <th scope="col" key={weekday.shortName}>
                  <BootstrapForm.Check
                    type="checkbox"
                    checked={
                      (selectedWeekdays.indexOf(weekday.number) !== -1) === true
                        ? true
                        : false
                    }
                    onChange={(e) => {
                      toggleSelectWeekday(weekday);
                    }}
                    label={weekday.shortName}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourRangesData.map((hourRangeData) => {
              return (
                <tr key={hourRangeData["12-hour-label"]}>
                  <td>
                    <BootstrapForm.Check
                      type="checkbox"
                      checked={
                        (selectedHourRanges.indexOf(
                          hourRangeData["12-hour-label"]
                        ) !==
                          -1) ===
                        true
                          ? true
                          : false
                      }
                      onChange={() => {
                        toggleSelectTimeRange(hourRangeData);
                      }}
                      label={hourRangeData["12-hour-label"]}
                    />
                  </td>
                  {getTableRowItems(hourRangeData)}
                </tr>
              );
            })}
          </tbody>
        </table>
        <h1>Results</h1>
        <p>The weekly time range table's state is:</p>
        {JSON.stringify(selectedWeeklyHourRanges)}
        <p>The GET_EVENTS GraphQL query is asking for this data:</p>
        {"query {queryEvent" + buildEventFilters() + "{ id title startTime }}"}
        {renderEventList()}
      </div>
    );
  } // end if (data && data.queryEvent)
}; //AllEvents

export default AllEvents;
