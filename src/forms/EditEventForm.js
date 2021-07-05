import React, { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { Link } from "react-router-dom";
import ReusedEventFormFields from "./ReusedEventFormFields";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";

const { DateTime } = require("luxon");

const UPDATE_EVENT = gql`
  mutation updateEvent(
    $id: ID!
    $title: String
    $startTime: String
  ) {
    updateEvent(
      input: {
        filter: { id: [$id] }
        set: {
          title: $title
          startTime: $startTime
        }
      }
    ) {
      event {
        id
        title
        startTime
      }
    }
  }
`;

const GET_EVENT = gql`
  query getEvent($id: ID!) {
    getEvent(id: $id) {
      id
      title
      startTime
    }
  }
`;

const EditEventForm = () => {
  const { eventId } = useParams();
  let history = useHistory();
  var now = DateTime.now();

  const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });
  const defaultStartTimeISO = defaultStartTimeObj.toISO();
  const [titleField, setTitleField] = useState("");
  const [startTimeField, setStartTimeField] = useState(defaultStartTimeISO);

  const [updateEvent, { error: updateEventError }] = useMutation(UPDATE_EVENT, {
    variables: {
      id: eventId,
      title: titleField,
      startTime: startTimeField,
    },
    errorPolicy: "all",
    onCompleted() {
      history.push(`/event/${eventId}`);
    },
  });

  const handleSubmit = async () => {
    await updateEvent();

    if (updateEventError) {
      alert("Could not update event.");
    }
  };

  const {
    loading: eventIsLoading,
    error: getEventError,
    data,
  } = useQuery(GET_EVENT, {
    variables: {
      id: eventId,
    },
  });

  useEffect(() => {
    if (data && data.getEvent) {
      const eventData = data.getEvent;
      const {
        title,
        startTime,
      } = eventData;

      setTitleField(title);
      setStartTimeField(startTime);
    }
  }, [data]);

  if (eventIsLoading) {
    return <p>Loading...</p>;
  }

  if (getEventError) {
    alert(`GET_EVENT error: ${getEventError}`);
    return null;
  }

  // If the event is not found,
  // provide a link back.
  if (!data.getEvent) {
    return (
      <div className="container">
        <div className="eventPage">
          <p>Could not find the event.</p>
          <Link to={`/`}>
            <p>
              <i className="fas fa-arrow-left"></i> Go back to event list
            </p>
          </Link>
        </div>
      </div>
    );
  }
  if (data.getEvent) {

    return (
      <div className="container">
        <div className="pageTitle">
          <span className="backButton" onClick={() => history.goBack()}>
            <i className="fas fa-arrow-left"></i> Back
          </span>{" "}
          | Edit Event
        </div>
        <h1>Edit Event</h1>
        <ReusedEventFormFields
          formState={{
            title: {
              title: titleField,
              setTitle: setTitleField,
            },
            startTime: {
              startTime: startTimeField,
              setStartTime: setStartTimeField,
            },
          }}
          submitMutation={handleSubmit}
        />
      </div>
    );
  }
};

export default EditEventForm;
