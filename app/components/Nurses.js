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
var binsArrayOfRatios = [];
var binsRatioValuePair = [];
var binsArrayValueArray = [];
var binArrayOfValues = [];



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
        patientNurseRatioArr: [],
        nurse_info: []
    };
    componentDidMount(){
        // axios.get('api/records')
        // .then(resp => {
        //     for (var i = 0; i < resp.data.records.length; i++){
        //         this.state.patientNurseRatioArr.push(resp.data.records[i]["patientNurseRatio"])
        //     }
        //     // console.log(this.state.patientNurseRatioArr);
        //     patientNurseRatioArray = this.state.patientNurseRatioArr;
        //
        //     // sort by number of patients
        //     patientNurseRatioArray = patientNurseRatioArray.sort(function(a, b) {
        //       return a - b;
        //     });
        //
        //     //This will create the bins for the ratio histogram. A bin of ratios, a bin for the nurse count
        //     // for each ratio and a bin containing an object with ratio and value key.
        //     createRatioBins();
        //
        //     //This will draw the histogram.
        //     drawHist(binsRatioValuePair);
        //     this.setState({ //Once we populate react app with nurse info, change these fields
        //         nurse_info: resp.data.records
        //     })
        // })
        // .catch(console.error);
        axios.get('api/records/ratios')
        .then(resp => {

            console.log(resp.data.records);
            // for (var i = 0; i < resp.data.records.length; i++){
            //     this.state.patientNurseRatioArr.push(resp.data.records[i]["patientNurseRatio"])
            // }
            // // console.log(this.state.patientNurseRatioArr);
            // patientNurseRatioArray = this.state.patientNurseRatioArr;
            //
            // // sort by number of patients
            // patientNurseRatioArray = patientNurseRatioArray.sort(function(a, b) {
            //   return a - b;
            // });
            //
            // //This will create the bins for the ratio histogram. A bin of ratios, a bin for the nurse count
            // // for each ratio and a bin containing an object with ratio and value key.
            // createRatioBins();
            //
            // //This will draw the histogram.
            // drawHist(binsRatioValuePair);
            // this.setState({ //Once we populate react app with nurse info, change these fields
            //     nurse_info: resp.data.records
            // })
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
                <legend> Nurse to Patient Histogram </legend>
                <legend> Yellow = Number of patients per nurse  </legend>
                <legend> White = Number of nurses with that ratio  </legend>
                <div className="chart"></div>
            </div>
        );
    };
};

function drawHist(arr) {
    var x = d3.scaleLinear()
        .domain([0, d3.max(binArrayOfValues)])
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

function createRatioBins() {
    var bins = {};

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
        binsArrayOfRatios.push(key);
        binsRatioValuePair.push({ratio: key, value: value});
        binArrayOfValues.push(value);
    }
};

ReactDOM.render(
    <Nurse/>,
    document.getElementById('index')
);
