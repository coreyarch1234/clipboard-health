import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';

import Index from './views/Index';
import NotFound from './views/NotFound';

// All of our CSS
require('../public/css/main.scss');

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/" exact component={Index} />
      <Route component={NotFound} status={404} />
    </Switch>
  </Router>,
  document.getElementById('root'),
);


// Testing React Code Understanding
const color = Math.random() > 0.5 ? 'green': 'red';
ReactDOM.render(
    <h2 className = "text-center" style={{color}}>This is another test</h2>,
    document.getElementById('index')
);

//React Component Profile
const Profile = (props) => {
    return(<h1 className = "text-center" style={{color}}>My name is Corey and {props.headerMessage}</h1>);
};

//React Prop Validation
Profile.propTypes = {
    headerMessage: React.PropTypes.string
};

Profile.defaultProps = {
    headerMessage: "Hello"
};

//React Component Accomplishments Class
class Accomplishments extends React.Component { //Use for state
    //Constructor
    state = {
        award: "The Webby Award"
    };
    render() {
        return(
            <div>
                <Profile headerMessage = "I am a software developer and I won the: "/>
                <h3>{this.state.award}</h3>
            </div>
        );
    };
};

ReactDOM.render(
    <Accomplishments/>, //Accomplishments Component
    document.getElementById('profile')
);
