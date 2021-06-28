import React, { useEffect } from "react";
import {
  getStartTimeISOs,
  getReadableTimeFromISO,
} from "../../eventUtils";
import TextField from "@material-ui/core/TextField";
import { DatePicker } from "@material-ui/pickers";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import FormControl from "@material-ui/core/FormControl";
const { DateTime } = require("luxon");

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width: "100%",
    maxWidth: 900,
  },
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "100%",
    },
    "& .MuiInputBase-input": {
      padding: 10,
      margin: 0,
    },
  },
}));

const ReusedEventFormFields = ({ formState, submitMutation }) => {
  // We reuse the fields for the create event form
  // and the edit event form because there is a lot of
  // detail and validation logic in them that should be in one
  // place.
  const {
    title: { title, setTitle },
    startTime: { startTime, setStartTime },
  } = formState;


  useEffect(() => {
    // We do these checks:
    // - Title is included
    // - Start date and time are in the future
    // console.log('Debug changes required', {
    //   title,
    //   startTime,
    // })
    let now = DateTime.now().toISO();
    const needsChanges = !(
      title.length > 0 &&
      startTime > now
    );

    if (needsChanges) {
      setChangesRequired(true);
      // console.log("changes are required");
      // console.log({
      //   title,
      //   startTime,
      // });
    } else {
      // console.log("changes are not required");
      // console.log({
      //   title,
      //   startTime,
      // });
      setChangesRequired(false);
    }
  }, [
    title,
    startTime,
  ]);

  const onSubmit = async (e) => {
    e.preventDefault();
    submitMutation();
  };

  const handleStartDateChange = (dateISO) => {
    setStartTime(dateISO);

  };

  const handleStartTimeChange = (dateISO) => {
    setStartTime(dateISO);

  };


  const classes = useStyles();
  const now = DateTime.now().toISO();

  return (
    <form className={classes.root} onSubmit={onSubmit}>
      <h2>About this Event</h2>
      <label>Event Name*</label>
      <TextField
        margin="normal"
        required
        autoFocus
        variant="outlined"
        error={touchedTitle && title.length === 0}
        value={title}
        className="form-control"
        onChange={(e) => {
          e.preventDefault();
          setTitle(e.target.value);
          setTouchedTitle(true);
        }}
        helperText={
          touchedTitle && title.length === 0
            ? eventFormErrorDescriptions.INVALID_TITLE
            : ""
        }
      />
      <div className="spacer" />

      <h2>Time</h2>
      <DatePicker
        margin="normal"
        error={startTime < now}
        format="cccc LLLL d"
        value={startTime}
        onChange={(newStartDateObj) => {
          const newStartDateISO = newStartDateObj.toISO();
          handleStartDateChange(newStartDateISO);
        }}
        helperText={startTime < now
            ? eventFormErrorDescriptions.START_TIME_NOT_IN_FUTURE
            : ""
        }
      />
      <FormControl className={classes.formControl}>
        <Autocomplete
          margin="normal"
          disableClearable
          value={startTime}
          style={{
            width: "100%",
          }}
          onChange={(_, newStartDateISO) => {
            handleStartTimeChange(newStartDateISO);
          }}
          renderOption={(option) => {
            return <span>{getReadableTimeFromISO(option)}</span>;
          }}
          getOptionLabel={(option) => {
            return getReadableTimeFromISO(option);
          }}
          options={getStartTimeISOs(startTime)}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                error={startTime < now ? true : false}
                onChange={({ target }) => setStartTime(target.value)}
                label="Start Time"
                helperText={startTime < now
                    ? eventFormErrorDescriptions.START_TIME_NOT_IN_FUTURE
                    : ""
                }
              />
            );
          }}
        ></Autocomplete>
      </FormControl>

      <div className="spacer" />
      <button
        type="button"
        onClick={onSubmit}
        disabled={changesRequired}
        className="form-submit btn btn-dark"
      >
        Submit
      </button>
      <div className="spacer" />
    </form>
  );
};

export default ReusedEventFormFields;
