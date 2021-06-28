import logo from './logo.svg';
import './App.css';
import { Switch, Route } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path='/' component={EventList} exact />
        <Route path='/event/:eventId' component={EventDetail} exact />
        <Route path={`/create-event`} exact>
          <CreateEventForm />
        </Route>
        <Route path={`/edit-event`} exact>
          <EditEventForm />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
