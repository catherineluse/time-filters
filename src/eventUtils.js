const { DateTime } = require("luxon");

export const relativeTime = (dateISO) => {
  let dateObj = DateTime.fromISO(dateISO);
  let time = dateObj.toRelative();

  return time;
};

export const relativeTimeHoursAndMinutes = (dateISO) => {
  let dateObj = DateTime.fromISO(dateISO);
  let time = dateObj.toRelative(["hours", "minutes"]);

  return time;
};

export const convertTimeToReadableFormat = (time) => {
  let timeObject = DateTime.fromISO(time);
  let humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE);
  return humanReadableTime;
};

export const getReadableTimeFromISO = (timeISO) => {
  let timeObject = DateTime.fromISO(timeISO);
  // TIME_SIMPLE yields the time in this format: 1:30 PM
  let humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE);
  return humanReadableTime;
};

export const getRelativeTimeFromISO = (timeISO) => {
  let humanReadableStartTime = getReadableTimeFromISO(timeISO);
  let timeFromNow = relativeTimeHoursAndMinutes(timeISO);
  return `${humanReadableStartTime} (${timeFromNow})`;
};

const MINUTES_IN_A_DAY = 1440;

export const getStartTimeISOs = (startTime) => {
  // The intent is to allow a user to select
  // a start time for an event by clicking
  // one option. This is more convenient
  // than typing and also helps us prevent
  // invalid inputs.

  // To make this possible, we generate a list of
  // start times at fifteen minute intervals.

  let startTimeISOs = [];
  let startOfToday = DateTime.now().startOf("day");
  let startTimeObj = DateTime.fromISO(startTime);

  // If the start date is today, the options
  // are only for later today.
  if (startTimeObj.startOf("day").toISO() === startOfToday.toISO()) {
    let endOfDay = startTimeObj.endOf("day");
    let currentOption = startTimeObj.plus({ minutes: 15 });
    while (currentOption < endOfDay) {
      let optionAsISO = currentOption.toISO();
      startTimeISOs.push(optionAsISO);
      currentOption = currentOption.plus({ minutes: 15 });
    }
    return startTimeISOs;
  }

  // If the start date is after today, the options
  // can be any time during the day.
  let beginningOfDay = startTimeObj.startOf("day");
  for (let i = 0; i < MINUTES_IN_A_DAY; i += 15) {
    let startTimeObject = beginningOfDay.plus({ minutes: i });
    let startTimeISO = startTimeObject.toISO();
    startTimeISOs.push(startTimeISO);
  }
  return startTimeISOs;
};
