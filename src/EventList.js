import React, {useEffect, useState} from "react";
import { useQuery, gql } from "@apollo/client";
const { DateTime } = require("luxon");




const timeRangeTypes = {
    FUTURE: "FUTURE",
    PAST: "PAST",
    CERTAIN_DAY: "CERTAIN_DAY",
    BETWEEN_TWO_DATES: "BETWEEN_TWO_DATES"
}

const AllEvents = () => {

    

  const now = DateTime.now();
  const defaultStartDateObj = now.startOf("day");
  const defaultStartDateISO = defaultStartDateObj.toISO();

  const [dateRange, setDateRange] = useState(timeRangeTypes.FUTURE)
  const [beginningOfDateRange, setBeginningOfDateRange] = useState(defaultStartDateISO)
  const [endOfDateRange, setEndOfDateRange] = useState(defaultEndDateISO);
  
  // Can be used to get events in non-contiguous years.
  const [requireYears, setRequireYears] = useState(false)
  const [years, setYears] = useState([])

  // Get events from a specific month across multiple years,
  // or non-contiguous months, like April and June but not May.
  const [requireMonths, setRequireMonths] = useState(false)
  const [months, setMonths] = useState([])

  // Can be combined with month to get events that happen
  // on a certain day without specifying the year.
  const [requireDaysOfMonth, setRequireDaysOfMonth] = useState(false)
  const [daysOfMonth, setDaysOfMonth] = useState([])

  // Can be used to get events that happen on certain weekdays.
  const [requireWeekdays, setRequireWeekdays] = useState(false)
  const [weekdays, setWeekdays] = useState([])

  const [requireRangeOfHours, setRequireRangeOfHours] = useState(false)
  const [beginningOfHourRange, setBeginningOfHourRange] = useState(defaultStartDateISO)
  const [endOfHourRange, setEndOfHourRange] = useState(defaultEndDateISO)

  const [queryOrder, setQueryOrder] = useState({order: { 
    desc: startTime
  }})
  const [startTimeFilter, setStartTimeFilter] = useState({
    startTime: {
        gt: defaultStartDateISO
      }
  })
  const [advancedTimeFilters, advancedTimeFilters] = useState(null)


  let GET_EVENTS = gql`
  query getEvents {
    queryEvent {
      id
      title
      description
      startTime
      endTime
      locationName
      virtualEventUrl
      address
      cost
      Community {
        url
      }
      Organizer {
        username
      }
      placeId
      latitude
      longitude
      Comments {
        id
        Author {
          username
        }
        text
      }
    }
  }
`

  const { loading, error, data } = useQuery(GET_EVENTS);

  let queryString = gql`
    query {
        queryEvent(
            filter: {
                startTime: {
                    lt: "2021-06-26T01:20:54.912Z"
                }
            },
            order: { 
                desc: startTime
                }, 
        ) { 
            id
            title
            startTime
        }
    }
`
  // The simple date filters are in this useEffect.
  // Search events before or after a DateTime,
  // or between min and max DateTimes.
  useEffect(() => {
      
      if (timeRange === timeRangeTypes.FUTURE){
        // order: { 
        //     asc: startTime,
        //   },
        // filter: {
        //     startTime: {
        //       gt: "2021-06-26T01:20:54.912Z"
        //     }
        //   },

        setQueryOrder({
            order: { 
                desc: startTime
              }
        })
      }
      if (timeRange === timeRangeTypes.PAST){
        // order: { 
        //     desc: startTime
        //   }, 
        // filter: {
        //     startTime: {
        //       lt: "2021-06-26T01:20:54.912Z"
        //     }
        //   },
      }

      if (timeRange === timeRangeTypes.CERTAIN_DAY){
        // (
        //     order: {
        //       asc: startTime
        //     },
        //     filter: { 
        //       startTime: { 
        //         between: { 
        //           min: beginning of day
        //           max: end of day
        //         } 
        //       } 
        //     })
      }

      if (timeRange === timeRangeTypes.BETWEEN_TWO_DATES){
        // (
        //     order: {
        //       asc: startTime
        //     },
        //     filter: { 
        //       startTime: { 
        //         between: { 
        //           min: beginning of date range
        //           max: end of date range 
        //         } 
        //       } 
        //     })
      }
  }, [startTime, beginningOfDateRange, endOfDateRange])

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
    if (requireYear){
        // queryEvent(filter: {
        //     startTimeYear: {
        //       eq: 2021
        //     },

        // use years
      }

      if (requireMonth){
        // queryEvent(filter: {
        //     startTimeMonth: {
        //       eq: 6
        //     },

        // use months
      }

      if (requireDayOfMonth){
        // queryEvent(filter: {
        //     startTimeDayOfMonth: {
        //       eq: 25
        //     },

        // use daysOfMonth
      }

      if (requireWeekdays){
        // queryEvent(filter: {
        //     startTimeDayOfWeek: {
        //       allofterms: "Thursday"
        //     },
        //     or: {
        //       startTimeDayOfWeek: {
        //         allofterms: "Friday"
        //       }
        //     }
        //   }

        // use weekdays
      }

      // Hour of day is a number from 0 to 23
      if (requireRangeOfHours){
        // queryEvent (filter: { 
        //     startTimeHourOfDay: { 
        //       between: { 
        //         min: 12, 
        //         max: 14 
        //       } 
        //     } 
        //   })

        // use beginningOfHourRange, endOfHourRange
      }
  }, [
      requireYears,
      years,
      requireMonths,
      months,
      requireDaysOfMonth,
      daysOfMonth,
      requireWeekdays,
      weekdays,
      requireRangeOfHours,
      beginningOfHourRange,
      endOfHourRange
  ])

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
        return eventsToRender.map((event, i) => {
            const {
              id,
              title,
              startTime,
            } = event;
      
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
      
            const duration = getDurationObj(startTime, endTime);
            const abbreviatedDuration = formatAbbreviatedDuration(duration);
      
            const handleClick = () => history.push(`/c/${inCommunity}/event/${id}`);
      
            let showDayHeader = false;
      
            // This is a temporary value. We change it
            // if a previous start time exists, allowing
            // us to check if the current event is on the
            // same day as the previous event in the list.
            let prevStartTimeObj = null;
      
            if (i > 0) {
              const prevEvent = eventsToRender[i - 1];
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
                      <Link
                        className="understatedLink"
                        to={`/c/${inCommunity}/event/${id}`}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
    }
    
    return (
      <div className="container">
        <h1>All Events</h1>
        {renderEventList()}
      </div>
    );
  }
};

export default AllEvents;
