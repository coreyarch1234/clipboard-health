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

var d3 = require("d3");

//For Ratio Histogram

// This will contain the ratios of all of the patients
var patientNurseRatioArray = [];

// This will contain the bins (arrays) of ratios for the histogram.
var binsOfRatios = [];

// This will contain the bins of the frequency/count for the ratios.
//Ex. A count of 10 nurses have the ratio of 5:1
var binsOfCounts = [];

// This will be an object (dictionary) with keys as ratios and values as counts.
var binsOfRatiosAndCounts = [];

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
    state = {
        patientNurseRatioArr: []
    };
    componentDidMount(){
        // Only query for ratios.
        axios.get('api/records/ratios')
        .then(resp => {
            for (var i = 0; i < resp.data.records.length; i++){
                this.state.patientNurseRatioArr.push(resp.data.records[i])
            }
            patientNurseRatioArray = this.state.patientNurseRatioArr;

            // sort by number of patients
            patientNurseRatioArray = sortArray(patientNurseRatioArray);

            //This will update the bins for the ratio histogram. Bins for the ratios.
            // Bins for the nurse counts.
            // Bins for the dictionary object containing ratio, count pair.
            binsOfRatiosAndCounts = createRatioBins();

            //This will draw the histogram.
            drawRatioHist(binsOfRatiosAndCounts);

            this.setState({
                patientNurseRatioArr: patientNurseRatioArray
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
                <legend> Nurse to Patient Histogram  </legend>
                <legend> Yellow = Number of patients per nurse  </legend>
                <legend> White = Number of nurses with that ratio  </legend>
                <div className="ratio-chart"></div>
            </div>
        );
    };
};

function drawRatioHist(arr) {
    var x = d3.scaleLinear()
        .domain([0, d3.max(binsOfCounts)])
        .range([0, 100]);

    var bar = d3.select(".ratio-chart")
        .selectAll("div")
        .data(arr)
        .enter().append("div")
        .style("width", function(d) {
            var v = x(Number(d.value)) + "em";
            return v;
        });

    bar.append("div")
        .attr("class", "ratio")
        .text(function(d) { return d.ratio })
    bar.append("div")
        .attr("class", "value")
        .text(function(d) { return d.value});
};

function createRatioBins() {
    var bins = {};

    for (var i = 0; i < patientNurseRatioArray.length; i++) {
        var ratio = Math.round(patientNurseRatioArray[i]);
        if (bins[ratio] === undefined) {
            bins[ratio] = 1;
        } else {
            bins[ratio] += 1;
        }
    };

    for (var key in bins) {
        var value = bins[key];
        binsOfRatios.push(key);
        binsOfRatiosAndCounts.push({ratio: key, value: value});
        binsOfCounts.push(value);
    };
    return binsOfRatiosAndCounts;
};


//Sort an array
function sortArray(array){
    array = array.sort(function(a, b) {
      return a - b;
    });
    return array;
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);
