# Clipboard Health Senior Engineer Interview Task

This project involves cleaning data from a CSV filled with nurse information and visualizing the data. To accomplish this, there were 4 general steps:

1. Implementing a python pipeline to ingest and clean the data.
2. Loading the data into a MongoDB.
3. Serving the data from an Express web server as an API.
4. Visualizing it using React and D3.

 * **Note:** I will be linking important files in this documentation. Feel free to click and view in a separate tab. I will be going over the important methods and implementations.

# Step 1 - Cleaning the data:

The [nurse information](data/projectnurse.csv) is stored in a CSV. The file contains 17 questions(columns) and 347 potential
responses(rows) (some are n/a or NaN). The data is ingested and cleaned in a [python pipeline](ingestion/pipeline.py).

This includes a main method:
```
def main():
    # Setup the database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['clipboardinterview']
    record_coll = db['records'] #change collection to nurses
    record_coll.drop()

    data_frame = pd.read_csv(join(dirname(__file__), '../data/projectnurse.csv'))

    # Replace all NaNs with empty string
    data_frame = data_frame.fillna('')

```
The database is set up and the records collection is stored in ```record_coll```.  Using pandas, a dataframe was created. All of the n/a and NaN's were replaced with an empty string, which was helpful in locating which rows did not have proper answers.

Next, a dictionary was created. The keys were the names of the schema attributes for the [Record Model](server/models/Record.js).

```
    questions = {
        "education": "What's your highest level of education?",
        "salary": "What is your hourly rate ($/hr)?",
        "experience": "How many years of experience do you have?",
        "department": "Department",
        "patientNurseRatio": "What is the Nurse - Patient Ratio?"
    }

```
Using these keys, the rows (responses) for each question could be accessed. Some columns (questions) needed to be cleaned. This includes the patientNurseRatio. Here are examples of some data entries:

Ratio 1: 3:1 days, 4:1 nights

Ratio 2: 1:01

Ratio 3: 5:1 (4:1 for telemetry patients)

Ratio 4: 4-5:1

The patientNurseRatio attribute takes in a Number. The goal was to grab the number that represents the number of patients
that particular nurse sees. Cleaning the data should provide that one number. Some answers included more than one ratios like
Ratio 1. Others included a range like in Ratio 4. Here is the breakdown of the cases (and edge cases) and how they were handled.

* **Simple Case:**  A ratio like, '1:1'. The cleaned version should store 1.

* **Multiple Ratio Case:** A ratio like,  '3:1 days, 4:1 nights'. Given the little information about this project, I assumed that
averaging the ratios would represent the nurse's patient load in the most accurate way. The cleaned version should store,
3.5 ((3 + 4)/2).

* **Range Ratio Case:** A ratio like, '4-5:1'. Using the same logic for the multiple ratio case, I figured finding the average
was the best route. The cleaned version should store, 4.5 ((4 + 5)/2).

With this in mind, here is the method used to clean the ratio data:

```

def clean_patient_nurse_ratio(nurse_count, data_frame_ratios): #Return a list of numbers (ratios)
    # Try out 3 Regex patterns.

    regex_patterns = [r'(\d+)-(\d+)[:]', r'(\d+)[:]', r'(\d+)']

    clean_ratios = []

    for nurse in range(nurse_count):

        nurse_answer_string = data_frame_ratios[nurse]
        number = 0  # default ratio value

        for pattern in regex_patterns:
            # all matches for current pattern

            # This is to check to see if a match is a ratio in fractional form
            # (i.e. 0.0666666 == 1/15. We should get 15)
            # We use the Fraction class to find the denominator. This is an edge case.
            if re.findall(r'([.]\d+)', nurse_answer_string):
                number = float(Fraction(nurse_answer_string).limit_denominator().denominator)
                break

            results = re.findall(pattern, nurse_answer_string)

            if results:
                # Average each of the matches for this pattern
                sum = 0.0
                for result in results:

                    # The result may be a range  such as (3-4:1), which is a tuple of (3, 4)
                    if isinstance(result, tuple):

                        # Average all the number groups matched in this pattern
                        tuple_sum = 0.0

                        for number in result:
                            tuple_sum += float(number)

                        tuple_avg = tuple_sum / len(result)
                        result = tuple_avg
                    sum += float(result)

                avg = sum / len(results)
                number = avg

                break  # Found a match, go get the cleaned up ratio number

        else:  # Finally, after the for-loop tries all patterns
            print "No match found for ANY patterns for string:"

        # Get the cleaned up ratio number
        clean_ratios.append(number)

        data_frame_ratios[nurse] = number # Update ratios column in data frame as it is cleaned

    return clean_ratios

```

* **Input:** Number of nurses (nurse_count) and the ratio column of the dataframe (data_frame_ratios).

* **Returns:** A list of clean ratio values (clean_ratios).

A list of regular expressions was used.

```r'(\d+)-(\d+)[:]'``` was used for ratios like, '3-4:1'

```r'(\d+)[:]'``` was used for ratios like 4:1

```r'(\d+)'``` was used for ratios without ':'.

This method loops through all of the patterns for each nurse ratio and and averages when appropriate. It then appends the
cleaned ratios to a list and updates the dataframe with the clean values.

This method also takes care of fractional ratios that may be submitted by using Python's Fraction class.

Similar, thorough cleaning methods were used for the 'salary' and 'experience' columns. The next step is to populate the database.

# Step 2 - Populating MongoDB:

This was done by looping through each nurse and creating a document for each one filled with the neccessary information.

```#Populate Records collection
    for nurse in range(nurse_count):
        education = data_frame[questions["education"]][nurse]
        salary = data_frame[questions["salary"]][nurse]
        experience = data_frame[questions["experience"]][nurse]
        department = data_frame[questions["department"]][nurse]
        patientNurseRatio = data_frame[questions["patientNurseRatio"]][nurse]

        # If for some reason, we do not return the proper type, set a default value of 0.
        if not isinstance(salary, int):
            salary = 0 #default
        if not isinstance(experience, int):
            experience = 0 #default
        if not isinstance(patientNurseRatio, float):
            patientNurseRatio = 0 #default

        doc = {
            "education": education,
            "salary": salary,
            "experience": experience,
            "department": department,
            "patientNurseRatio": patientNurseRatio
        }

        record_coll.insert(doc)
```
After each ```doc``` was created, it was inserted into the records collection. Default values were also put into place in case there was a salary, experience or patientNurseRatio value that was not the correct type.

# Step 3 - Serving the data:

Once the database has been populated with clean data, the queries could be created. Two queries were written. One for getting the whole database and the other for just the 'patientNurseRatio' column.

[The ratio query](server/models/routes/api/ratios.js):

```
import Record from '../../models/Record';

//Get ratios
export default (req, res) => {
  var ratioArr = []
  Record.find().then((records) => {
    for (var i = 0; i < records.length; i++){
        ratioArr.push(records[i]["patientNurseRatio"])
    }
    res.json({
      records: ratioArr,
      success: true,
    });
  }).catch((error) => {
    res.json({
      error,
      success: false,
    });
  });
};


```
If finding the ratio column was successful, the ratios were pushed to a ```ratioArr``` and this was included in the response.

The reason for making a query for the ratios was because the patientNurseRatio field was needed for visualization. It would be inefficient to query the whole database when only the ratios were needed for the React/D3 visualization.

# Step 4 - Visualization:

[A Nurse component](app/components/Nurses.js) was created that would be the entry point for the React app. The goal of this component is to produce a Histogram representing the nurse frequency of certain ratios. In other words, it represents the number of nurses that have each specific ratio.

![ScreenShot](http://i.imgur.com/LQUjEAI.png)

The variables below were created to store bins (range of ratio values) for the histogram.

```
//For Ratio Histogram

// This will contain the ratios of all of the patients
var patientNurseRatioArray = [];

// This will contain the bins (arrays) of ratios for the histogram.
var binsOfRatios = [];

// This will contain the bins of the frequency/count for the ratios.
//Ex. A count of 10 nurses have the ratio of 5:1
var binsOfCounts = [];

// This will be an array of objects (dictionaries) with keys as ratios and values as counts.
var binsOfRatiosAndCounts = [];
```

A ```createRatioBins()``` function returned an array of dictionaries with the ratios as the keys and the frequency (how many nurses had that ratio) as the values. This function loops through the array of the ratio values (```patientNurseRatioArray```) and creates the bin array (```binsOfRatiosAndCounts```).

```
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
```
The ```patientNurseRatioArray``` is created once the query is made, which will be shown soon.

To create the histogram itself, ```binsOfRatiosAndCounts``` was passed in as the data.

```
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
```

The bars created were given text that represented the ratio or number of patients per nurse (yellow on the left) and the nurse frequency (on the right).

Here is the Nurse Component:

```
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

```

Axios, a promise based HTTP client for the browser and node.js, was used to make the get request for the ratios. This is done in the ```componentDidMount()``` function. ```drawRatioHist()``` is also called and is passed in the dictionary object of ratios and frequencies.


This project uses a variety of different technologies really well to output a visualization for the patientNurseRatio data field. With more time, histograms could have easily been made for the 'salary' and 'experience' fields.  
