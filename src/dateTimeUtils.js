

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
