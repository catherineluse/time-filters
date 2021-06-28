import React, { useState, useContext} from "react";
import { Auth0Context } from "../../../react-auth0-spa";
import { useMutation, gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ADD_EVENT } from "../../../graphQLData/event/mutations";
import { getUsername } from "../../usernameUtils";
import ReusedEventFormFields from "./eventFormFields/ReusedEventFormFields";
import { useHistory } from "react-router-dom";
import { GET_COMMUNITY_WITH_DISCUSSIONS_AND_EVENTS } from '../../../graphQLData/community/queries';

const { DateTime } = require("luxon");

var now = DateTime.now();

const CreateEventForm = () => {
  const { url } = useParams();
  let history = useHistory();

  const { user } = useContext(Auth0Context);
  const username = getUsername(user);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });
  const defaultStartTimeISO = defaultStartTimeObj.toISO();
  const [startTime, setStartTime] = useState(defaultStartTimeISO);

  const defaultEndTimeISO = defaultStartTimeObj.plus({ minutes: 15 }).toISO();
 

  const [addEvent] = useMutation(ADD_EVENT, {
    variables: {
      title,
      startTime,
    },
    onCompleted({ addEvent }) {
      const newEventId = addEvent.event[0].id;
      history.push(`/c/${url}/event/${newEventId}`);
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
    <>
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
        }}
        submitMutation={addEvent}
      />
    </>
  );
};

export default CreateEventForm;
