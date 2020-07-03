import React from 'react';
import logo from './logo.svg';
import './App.css';
import './style.scss';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import DashBoard from "./components/dsahboard";
import Meeting from "./components/meeting";
import JoinMeeting from "./components/join";
import Session from "./components/session";
import DashbaordOne from "./components/rooms/dsahboard1"

function App() {
  return (
    <div className="App">
      {/* <header className="App-header"> */}
      <Router>
        <div className="root">
          <Switch>
            {/* for admin */}
            <Route path="/" component={DashBoard} exact />
            <Route path="/:meetingName/:member" component={DashbaordOne} exact />
            <Route path="/meeting" component={Meeting} exact />
            {/* for attendees */}
            <Route path="/join" component={JoinMeeting} exact />
            <Route path="/currentSession" component={Session} exact />
          </Switch>

        </div>
      </Router >
      {/* </header> */}
    </div>
  );
}

export default App;
