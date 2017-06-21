# Clipboard Health Senior Engineer Interview Task

This project involves cleaning data from a CSV filled with nurse information and visualizing the data. To accomplish this there were 4 general steps:

1. Implementing a python pipeline to ingest and clean the data.
2. Loading the data into a MongoDB.
3. Serving the data from an Express web server as an API.
4. Visualizing it using React and D3.

 * **Note:** I will be linking important files in this documentation. Feel free to click and view in a separate tab.

# Step 1 - Cleaning the data:

The [nurse information](data/projectnurse.csv) is stored in a CSV. The file contains 17 questions and 347 potential
responses (some are n/a or NaN). The data is ingested and cleaned in a [python pipeline](ingestion/pipeline.py).

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
The database is set up and the records collection is stored in ```record_coll```.  Using pandas, I created a dataframe
and replaced all of the n/a and NaN's with an empty string, which was helpful in locating which rows did not have proper answers.

Next, a dictionary was used. The keys were the names of the schema attributes for the [Record Model](server/models/Record.js).

```
    questions = {
        "education": "What's your highest level of education?",
        "salary": "What is your hourly rate ($/hr)?",
        "experience": "How many years of experience do you have?",
        "department": "Department",
        "patientNurseRatio": "What is the Nurse - Patient Ratio?"
    }

```
From this, finding all of the rows (responses) for each question was simple. The interested columns (questions) were the ones
I have to clean. This includes the patientNurseRatio. Here are examples of some data entries:

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

With this in mind, here is the method to clean the ratio data:

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

* **Input:** Number of nurses and the ratio column of the dataframe.

* **Returns:** A list of clean ratio values.

A list of regular expressions was used.

```r'(\d+)-(\d+)[:]'``` was used for ratios like, '3-4:1'

```r'(\d+)[:]'``` was used for ratios like 4:1

```r'(\d+)'``` was used for ratios without ':'.

This method loops through all of the patterns for each nurse ratio and and averages when appropriate. It then appends the
cleaned ratios to a list and updates the dataframe with the clean values.

This method also takes care of fractional ratios that may be submitted by using Python's Fraction class.

Similar, thorough cleaning methods were used for the 'salary' and 'experience' columns. Next step is to populate the database.

# Step 2 - Populating MongoDB:
