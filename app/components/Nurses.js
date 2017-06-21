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
var patientNurseRatioArray = [];
var binsArrayRatio = [];
var binsArrayValueArray = [];
var binValueArray = [];


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
        // salaryArr: [],
        // experience: null,
        // department: "",
        patientNurseRatioArr: [],
        nurse_info: []
    };
    componentDidMount(){
        axios.get('api/records') //Just query ratio
        .then(resp => {
            for (var i = 0; i < resp.data.records.length; i++){
                this.state.patientNurseRatioArr.push(resp.data.records[i]["patientNurseRatio"])
            }
            // console.log(this.state.patientNurseRatioArr);
            patientNurseRatioArray = this.state.patientNurseRatioArr;

            console.log(typeof patientNurseRatioArray[0]);

            // sort by number of patients
            patientNurseRatioArray = patientNurseRatioArray.sort(function(a, b) {
              return a - b;
            })

            var bins = {};
            var binsArrayValue = [];
            // var binsArrayRatio = [];

            for (var i = 0; i < patientNurseRatioArray.length; i++) {
                var ratio = Math.round(patientNurseRatioArray[i]);
                if (bins[ratio] === undefined) {
                    bins[ratio] = 1
                } else {
                    bins[ratio] += 1
                }
            }

            for (var key in bins) {
                var value = bins[key];
                binsArrayRatio.push(key);
                binsArrayValue.push({ratio: key, value: value});
                binValueArray.push(value);
            }

            console.log(binsArrayValue);

            drawChart(binsArrayValue);
            // drawChart(patientNurseRatioArray);
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
                <h1> Patient to Nurse Ratio Histogram </h1>
                <div className="chart"></div>
            </div>

        );
    };
};

//Histogram
function drawHist(arr) {
    var x = d3.scaleLinear()
        .rangeRound([0, 347])
    // var bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(20))
        (arr);
    // console.log(bins)

};

function drawChart(arr) {
    var x = d3.scaleLinear()
        .domain([0, d3.max(binValueArray)])
        .range([0, 100]);

    var bar = d3.select(".chart")
        .selectAll("div")
        .data(arr)
        .enter().append("div")
        .style("width", function(d) {
            console.log(d);
            console.log(d.value);
            var v = x(Number(d.value)) + "em";
            console.log(v);
            return v;
        });

    bar.append("div")
        .attr("class", "ratio")
        .text(function(d) { return d.ratio })
    bar.append("div")
        .attr("class", "value")
        .text(function(d) { return d.value});
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);
