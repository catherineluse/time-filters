import logo from "./logo.svg";
import "./App.css";
import { Switch, Route, Router } from "react-router-dom";
import EventList from "./EventList";
import EventDetail from "./EventDetail";
import CreateEventForm from "./forms/CreateEventForm";
import EditEventForm from "./forms/EditEventForm";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { createBrowserHistory } from "history";
import LuxonUtils from "@date-io/luxon";
import { createHttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";

let history = createBrowserHistory();

const cache = new InMemoryCache({
  typePolicies: {
    Community: {
      keyFields: ['url'],
    },
    User: {
      keyFields: ['username'],
    },
  },
});

const createApolloClient = (token) => {
  const httpLink = createHttpLink({
    uri: "http://localhost:8080/graphql",
    options: {
      reconnect: true,
    },
  });

  const authLink = setContext((_, { headers }) => {
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache,
  });
};

function App() {
  const client = createApolloClient();

  return (
    <div className="App">
      <ApolloProvider client={client}>
        <Router history={history}>
          <MuiPickersUtilsProvider utils={LuxonUtils}>
            <Switch>
              <Route path="/" component={EventList} exact />
              <Route path="/event/:eventId" component={EventDetail} exact />
              <Route path={`/create-event`} exact>
                <CreateEventForm />
              </Route>
              <Route path={`/edit-event`} exact>
                <EditEventForm />
              </Route>
            </Switch>
          </MuiPickersUtilsProvider>
        </Router>
      </ApolloProvider>
    </div>
  );
}

export default App;
