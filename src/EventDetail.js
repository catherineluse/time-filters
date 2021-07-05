import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { Link } from "react-router-dom";
const { DateTime } = require("luxon");

const GET_EVENT = gql`
  query getEvent($id: ID!) {
    getEvent(id: $id) {
      id
      title
      startTime
      startTimeYear
      startTimeMonth
      startTimeDayOfMonth
      startTimeDayOfWeek
      startTimeHourOfDay
      startTimeZone
    }
  }
`;

const EventDetail = () => {
  // If the commentId is provided, we assume
  // the comment is permalinked, so only one
  // comment thread is rendered instead
  // of all the comments.
  const { eventId } = useParams();

  const {
    loading: eventIsLoading,
    error,
    data,
  } = useQuery(GET_EVENT, {
    variables: {
      id: eventId,
    },
  });

  if (eventIsLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    alert(`GET_EVENT error: ${error}`);
    return null;
  }

  // If the event is not found,
  // provide a link back.
  if (!data.getEvent) {
    return (
      <div className="container">
        <div className="eventPage">
          <p>Could not find the event.</p>
          <Link to={`/events`}>
            <p>
              <i className="fas fa-arrow-left"></i> Go back
            </p>
          </Link>
        </div>
      </div>
    );
  }
  if (data.getEvent) {
    const eventData = data.getEvent;

    const {
      id: eventId,
      title,
      startTime,
      startTimeYear,
      startTimeMonth,
      startTimeDayOfMonth,
      startTimeDayOfWeek,
      startTimeHourOfDay,
      startTimeZone,
    } = eventData;

    const startTimeObj = DateTime.fromISO(startTime);
    const now = DateTime.now();
    const formattedStartDateString = startTimeObj.toFormat("cccc LLLL d yyyy");
    const formattedStartTimeString = startTimeObj.toLocaleString(
      DateTime.TIME_SIMPLE
    );
    const timeZone = startTimeObj.zoneName;

    return (
      <div className="container">
        <div className="eventPage">
          <div className="pageTitle">
            <span className="backButton">
              <Link to={`/`}>
                <i className="fas fa-arrow-left"></i> Back to Event List
              </Link>
            </span>
          </div>
          {startTimeObj < now ? (<div className="pastEventNotice">This event is in the past.</div>) : null}
          
          <div className="eventBody">
            <h1>{title}</h1>

            <div className="details">
              <i className="far fa-calendar"></i>
              <p>DateTime: </p>
                {formattedStartDateString} at {`${formattedStartTimeString}`}
                <div className="time-zone">{`Time zone: ${timeZone}`}</div>

                <Link className="understatedLink" to={`/edit-event/${eventId}`}>
                  Edit
                </Link>
              <hr />
              <ul>
                <li>startTimeYear: {startTimeYear}</li>
                <li>startTimeMonth: {startTimeMonth}</li>
                <li>startTimeDayOfMonth: {startTimeDayOfMonth}</li>
                <li>startTimeDayOfWeek: {startTimeDayOfWeek}</li>
                <li>startTimeHourOfDay: {startTimeHourOfDay}</li>
                <li>startTimeZone: {startTimeZone}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default EventDetail;
