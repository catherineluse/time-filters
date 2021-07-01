

# Running the back end

To set up the back end, I started Dgraph's Docker quickstart:

```
docker run -it -p 8080:8080 dgraph/standalone:master
```

I created a `schema.graphql` file containing the event type:

```
type Event {
  id: ID!
  title: String!
  startTime: DateTime! @search
  startTimeYear: Int! @search
  startTimeMonth: Int! @search
  startTimeDayOfMonth: Int! @search
  startTimeDayOfWeek: String! @search
  startTimeHourOfDay: Int! @search
  startTimeZone: String! @search
}
```

Then I added the schema in the `schema.graphql` to Dgraph: 

```
curl -X POST BACKEND-IP:8080/admin/schema --data-binary '@schema.graphql'
```

I added sample data by sending a POST request to `http://BACKEND-IP/graphql` with a GraphQL mutation in the body:

```
mutation {
  addEvent(input: [
    {
      title: "Tempe Event",
      startTime: "2021-06-25T02:21:37.146Z",
      startTimeYear: 2021
      startTimeMonth: 6
      startTimeDayOfMonth: 25
      startTimeDayOfWeek: "Friday"
      startTimeHourOfDay: 2
    },
    {
      title: "Phoenix Event",
      startTime: "2022-07-25T02:21:37.146Z",
      startTimeYear: 2022
      startTimeMonth: 7
      startTimeDayOfMonth: 25
      startTimeDayOfWeek: "Friday"
      startTimeHourOfDay: 2
    },
    {
      title: "Flagstaff Event",
      startTime: "2023-08-25T05:21:37.146Z",
      startTimeYear: 2022
      startTimeMonth: 8
      startTimeDayOfMonth: 25
      startTimeDayOfWeek: "Friday"
      startTimeHourOfDay: 5
    },
  ]) {
    event {
      id
      title
      startTime
    }
  }
}

```

# Running the front end

```
npm start
```