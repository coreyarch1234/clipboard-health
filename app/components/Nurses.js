import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios' //to make Ajax requests
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';

import Index from '../views/Index';
import NotFound from '../views/NotFound';
import Profile from './Profile';

// All of our CSS
require('../../public/css/main.scss');

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/" exact component={Index} />
      <Route component={NotFound} status={404} />
    </Switch>
  </Router>,
  document.getElementById('root'),
);

// Nurse Profile Information Page
class Nurse extends React.Component { //Use for state
    //Constructor
    state = { //You want to be able to update this data
        // education: "",
        // salary: null,
        // experience: null,
        // department: "",
        // patientNurseRatio: null
        nurse_info: []
    };
    componentDidMount(){
        axios.get('api/records')
        .then(resp => {
            this.setState({ //Once we populate react app with nurse info, change these fields
                //use an ajax request
                // education: "",
                // salary: null,
                // experience: null,
                // department: "",
                // patientNurseRatio: null
                nurse_info: resp.data.records
            })
            // console.log(resp.data.records);
        })
        .catch(console.error);
    };
    componentWillUnmount(){

    };
    render() {
        return(
            <div className= "Nurses text-center">
                {this.state.nurse_info.map(nurse =>
                    <Profile key={nurse.id} {...nurse} />
                )};
            </div>
        );
    };
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);
