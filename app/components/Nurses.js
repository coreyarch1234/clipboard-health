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
var d3 = require("d3");
var salaryArray = [];


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
        salaryArr: [],
        // experience: null,
        // department: "",
        // patientNurseRatio: null
        nurse_info: []
    };
    componentDidMount(){
        axios.get('api/records') //Just query salary
        .then(resp => {
            for (var i = 0; i < resp.data.records.length; i++){
                this.state.salaryArr.push(resp.data.records[i]["salary"])
            }
            console.log(this.state.salaryArr);
            salaryArray = this.state.salaryArr;
            drawChart(salaryArray);
            this.setState({ //Once we populate react app with nurse info, change these fields
                //use an ajax request
                // education: "",
                // salaryArr: resp.data.records[5]["salary"],
                // experience: null,
                // department: "",
                // patientNurseRatio: null
                nurse_info: resp.data.records
            })
        })
        .catch(console.error);

    };

    shouldComponentUpdate() {

        return false; // This prevents future re-renders of this component
    }
    componentWillUnmount(){

    };
    render() {
        return(
            <div className= "Nurses text-center">
                <div className="chart"></div>
            </div>

        );
    };
};

function drawChart(arr) {
    var x = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range([0, 420]);

    d3.select(".chart")
      .selectAll("div")
        .data(arr)
      .enter().append("div")
        .style("width", function(d) { return x(d) + "px"; })
        .text(function(d) { return d; });
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);
