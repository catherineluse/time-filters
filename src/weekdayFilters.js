export const buildWeekdayFilterRecursively = (weekdays) => {
    // The idea with the recursive weekday filter is to build something
    // like this when multiple weekdays are specified:

      //   query {
      //     queryEvent(filter: {
      //       startTime: {
      //           gt: "2023-06-26T01:20:54.912Z"
      //       },
      //       and: {
      //         startTimeDayOfWeek: {
      //           allofterms: "Thursday"
      //         },
      //         or: {
      //           startTimeDayOfWeek: {
      //             allofterms: "Friday"
      //           },
      //           or: {
      //             startTimeDayOfWeek: {
      //               allofterms: "Wednesday"
      //             }
      //           }
      //         }
      //       }
      //     }){
    if (weekdays.length === 0) {
        return;
    }
    if (weekdays.length === 1){
        return `or: {startTimeDayOfWeek: {allofterms: "${weekdays[0]}"}}`
    }
    if (weekdays.length > 1){
        return `or: {startTimeDayOfWeek: { allofterms: "${weekdays[0]}"}, ${buildWeekdayFilterRecursively(weekdays.slice(1))}}`
    }
}

export const buildWeekdayFilter = (weekdays) => {

    if (weekdays.length === 0){
        return ""
    }
    if (weekdays.length === 1){
      return `startTimeDayOfWeek: {allOfTerms: "${weekdays[0]}"}`
    }
    if (weekdays.length > 1){
        return `and: {startTimeOfWeek: {allofterms: "${weekdays[0]}"},${buildWeekdayFilterRecursively(weekdays.slice(1))}}`
    }
}

// Example results of buildWeekdayFilter:
//
// > let oneDay = ["Monday"]
// > let twoDays = ["Tuesday", "Monday"]
// > let threeDays = ["Saturday", "Monday", "Tuesday"]
// > buildWeekdayFilter(oneDay)
// 'startTimeDayOfWeek: {allOfTerms: "Monday"}'
// > buildWeekdayFilter(twoDays)
// 'and: {startTimeOfWeek: {allofterms: "Tuesday"},or: {startTimeDayOfWeek: {allofterms: "Monday"}}}'
// > buildWeekdayFilter(threeDays)
// 'and: {startTimeOfWeek: {allofterms: "Saturday"},or: {startTimeDayOfWeek: { allofterms: "Monday"}, or: {startTimeDayOfWeek: {allofterms: "Tuesday"}}}}'