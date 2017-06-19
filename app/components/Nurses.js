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
            <div>
                <p>Nurse Info</p>
                // <p className = "text-center">Education: {this.state.education}</p>
                // <p className = "text-center">Salary: ${this.state.salary}</p>
                // <p className = "text-center">Experience: {this.state.experience}</p>
                // <p className = "text-center">Department: {this.state.department}</p>
                // <p className = "text-center">Patient Count Ratio: {this.state.patientNurseRatio}</p>
            </div>
        );
    };
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);


// //React Component Profile
// const Profile = (props) => {
//     return(<h1 className = "text-center" style={{color}}> Nurse: {props.headerMessage}</h1>);
// };
//
// //React Prop Validation
// Profile.propTypes = {
//     headerMessage: React.PropTypes.string
// };
//
// Profile.defaultProps = {
//     headerMessage: "Nurse A"
// };
//
// ReactDOM.render(
//     <Salary/>, //Salary Component
//     document.getElementById('profile')
// );
