import React, { useEffect } from "react";
import {
  getStartTimeISOs,
  getReadableTimeFromISO,
} from "../eventUtils";
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
    startTimePieces: {startTimePieces, setStartTimePieces}
  } = formState;

  const onSubmit = async (e) => {
    e.preventDefault();
    submitMutation();
  };

  useEffect(() => {
    // This function is necessary to keep the startTime
    // field consistent with other fields that represent
    // its individual components. These components,
    // such as month, weekday and hour, need to be stored
    // separately to allow advanced time filtering based on
    // multiple non-contiguous windows of time.
    const updateSeparateTimeFields = () => {
        const startTimeObj = DateTime.fromISO(startTime)
        const { year, month, day, weekday, hour, zone } = startTimeObj;
        console.log({ year, month, day, weekday, hour, zone })

        setStartTimePieces({
          startTimeYear: year.toString(),
          startTimeMonth: month.toString(),
          startTimeDayOfMonth: day.toString(),
          startTimeDayOfWeek: weekday.toString(),
          startTimeHourOfDay: hour,
        })
    }
    
    updateSeparateTimeFields()
  }, [startTime, setStartTimePieces])

  const handleStartDateChange = (dateISO) => {
    setStartTime(dateISO);
  };

  const handleStartTimeChange = (dateISO) => {
    setStartTime(dateISO);
  };

  const classes = useStyles();

  return (
    <form className={classes.root} onSubmit={onSubmit}>
      <h2>About this Event</h2>
      <label>Event Name*</label>
      <TextField
        margin="normal"
        required
        autoFocus
        variant="outlined"
        value={title}
        className="form-control"
        onChange={(e) => {
          e.preventDefault();
          setTitle(e.target.value);
        }}
      />
      <div className="spacer" />

      <h2>Time</h2>
      <DatePicker
        margin="normal"
        format="cccc LLLL d"
        value={startTime}
        onChange={(newStartDateObj) => {
          const newStartDateISO = newStartDateObj.toISO();
          handleStartDateChange(newStartDateISO);
        }}
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
                onChange={({ target }) => setStartTime(target.value)}
                label="Start Time"
              />
            );
          }}
        ></Autocomplete>
      </FormControl>
      <p>This form automatically updated these fields based on the start time:</p>
      <p>{JSON.stringify(startTimePieces)}</p>
      <div className="spacer" />
      <button
        type="button"
        onClick={onSubmit}
        className="form-submit btn btn-dark"
      >
        Submit
      </button>
      <div className="spacer" />
    </form>
  );
};

export default ReusedEventFormFields;
