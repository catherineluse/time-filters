import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import ReusedEventFormFields from "./ReusedEventFormFields";
import { useHistory } from "react-router-dom";

const { DateTime } = require("luxon");

var now = DateTime.now();

const ADD_EVENT = gql`
  mutation addEvent(
    $title: String!
    $startTime: DateTime!
    $startTimeYear: String!
    $startTimeMonth: String!
    $startTimeDayOfMonth: String!
    $startTimeDayOfWeek: String!
    $startTimeHourOfDay: Int!
  ) {
    addEvent(
      input: [
        {
          title: $title
          startTime: $startTime
          startTimeYear: $startTimeYear
          startTimeMonth: $startTimeMonth
          startTimeDayOfMonth: $startTimeDayOfMonth
          startTimeDayOfWeek: $startTimeDayOfWeek
          startTimeHourOfDay: $startTimeHourOfDay
        }
      ]
    ) {
      event {
        id
        title
        startTime
        startTimeYear
        startTimeMonth
        startTimeDayOfMonth
        startTimeDayOfWeek
        startTimeHourOfDay
      }
    }
  }
`;

const CreateEventForm = () => {
  const { url } = useParams();
  let history = useHistory();

  const [title, setTitle] = useState("");

  const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });
  const defaultStartTimeISO = defaultStartTimeObj.toISO();
  const [startTime, setStartTime] = useState(defaultStartTimeISO);
 
  const [startTimePieces, setStartTimePieces] = useState({
    startTimeYear: defaultStartTimeObj.year.toString(),
    startTimeMonth: defaultStartTimeObj.month.toString(),
    startTimeDayOfMonth: defaultStartTimeObj.day.toString(),
    startTimeDayOfWeek: defaultStartTimeObj.weekday.toString(),
    startTimeHourOfDay: defaultStartTimeObj.hour,
  })

  const [addEvent] = useMutation(ADD_EVENT, {
    variables: {
      title,
      startTime,
      startTimeYear: startTimePieces.startTimeYear,
      startTimeMonth: startTimePieces.startTimeMonth,
      startTimeDayOfMonth: startTimePieces.startTimeDayOfMonth,
      startTimeDayOfWeek: startTimePieces.startTimeDayOfWeek,
      startTimeHourOfDay: startTimePieces.startTimeHourOfDay,
    },
    onCompleted({ addEvent }) {
      const newEventId = addEvent.event[0].id;
      history.push(`/event/${newEventId}`);
    },
    update(cache, { data: { addEvent }}) {
      const newEvent = addEvent.event[0]
      cache.modify({
        fields: {
          queryEvent(existingEventRefs = [], { readField }) {
            const newEventRef = cache.writeFragment({
              data: newEvent,
              fragment: gql`
                fragment NewEvent on Event {
                  id
                }
              `,
            });

            // Quick safety check - if the new community is already
            // present in the cache, we don't need to add it again.
            if (
              existingEventRefs.some(
                (ref) => readField('url', ref) === addEvent.url
              )
            ) {
              return existingEventRefs;
            }
            return [newEventRef, ...existingEventRefs];
          },
        },
      });
    },
  });


  return (
    <div className="container">
      <div className="pageTitle">
        <span className="backButton">
          <Link to={`/c/${url}/events`}>
            <i className="fas fa-arrow-left"></i> Back to Event List
          </Link>
        </span>{" "}
        | Create Event
      </div>
      <h1>Create an Event</h1>

      <ReusedEventFormFields
        formState={{
          title: {
            title,
            setTitle,
          },
          startTime: {
            startTime,
            setStartTime,
          },
          startTimePieces: {
            startTimePieces,
            setStartTimePieces
          }
        }}
        submitMutation={addEvent}
      />
    </div>
  );
};

export default CreateEventForm;
