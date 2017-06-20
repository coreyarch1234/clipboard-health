from os.path import join, dirname
import csv
import json
import re
import math
import pandas as pd
import numpy as np
from pymongo import MongoClient

"""

Use this file to read in the project nurse data, perform text pre-processing
and store data in mongo. The fields we're interested in storing are:

  'How many years of experience do you have?' -> experience,
  'What's your highest level of education?' -> education,
  'What is your hourly rate ($/hr)?' -> salary,
  'Department' -> department,
  'What (City, State) are you located in?' -> location,
  'What is the Nurse - Patient Ratio?' -> patientNurseRatio

Check server/models/Record.js for an example of the schema.

Subtasks:

1) Use csv.DictReader to create JSON where keys are the questions and values are the answers (i.e. - {salary: 28})
2) Exclude keys we don't need. All we need is: experience, education, salary, department, location, patientNurseRatio.
Note that the keys will be the full questions at first, so we need to convert that to the Record.js model attribute keys
3) Populate the Record model with the salary and patientNurseRatio fields

"""
def create_nurse_json(csv, column, question_key):
    index = 0
    nurse_questions_dict, nurse_answers_dict = {}, {}
    for line in csv:
        nurse_answers_dict[index] = line.iloc[0,column]
        index += 1
    nurse_questions_dict[question_key] = nurse_answers_dict
    return nurse_questions_dict

def main():
    # Setup the database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['clipboardinterview']
    record_coll = db['records'] #change collection to nurses
    record_coll.drop()

    #This will be my nurse JSON. Is a list of dictionaries. The keys are the questions (i.e. - salary?) and the values are
    # are dictionaries where the keys are incremental indices (0,1,..) and the values are the answers to the question for each nurse.
    data_frame = pd.read_csv(join(dirname(__file__), '../data/projectnurse.csv'))

    # Replace all NaNs with empty string
    data_frame = data_frame.fillna('')

    # FIXME: TEMPORARY HACK TO DEAL WITH LESS data_frame
    nurse_first, nurse_last = 80, 100
    data_frame = data_frame[nurse_first:nurse_last]

    # Explore the data frame
    # print data_frame
    print type(data_frame)
    print data_frame.shape
    # print data_frame["Department"]
    # print data_frame[:10]
    # print data_frame["Department"][:10]
    # print data_frame[:10]["Department"]

    # for key in data_frame:
    #     print key
    #     print type(key)
    #     print len(key)

    list_of_questions = [
        "What (City, State) are you located in?",
        "What's your highest level of education?",
        "Department",
        "How's the employee turnover?",
        "How many years of experience do you have?",
        "What is/was your length of orientation/training?",
        "What is the Nurse - Patient Ratio?",
        "What is your hourly rate ($/hr)?",
        "What's Your Shift Length?",
        "Which Shift?",
        "Other",
        "Full-Time/Part-Time?",
        "Do you have any special skills that set you apart from other nurses? (examples: CCRN, CNOR, Special Procedures, etc.)",
        "Would you recommend your department to another nurse?",
        "How did you hear about Project Nurse?",
        "Start Date (UTC)",
        "Submit Date (UTC)"]

    questions = {
        "education": "What's your highest level of education?",
        "salary": "What is your hourly rate ($/hr)?",
        "experience": "How many years of experience do you have?",
        "department": "Department",
        "patientNurseRatio": "What is the Nurse - Patient Ratio?"
    }

    #Get a list of all of the ratio answers
    nurse_count = data_frame.shape[0]
    ratios = data_frame[questions["patientNurseRatio"]]  # all of the ratios
    print ratios
    print

    regex_patterns = [r'(\d+)-(\d+)[:]', r'(\d+)[:]', r'(\d+)']

    ratios_clean = []
    # nurse_count = data_frame.shape[0]
    # for nurse in range(nurse_count):
    # FIXME: TEMPORARY HACK TO DEAL WITH LESS data_frame
    for nurse in range(nurse_first, nurse_last):
        string = ratios[nurse]
        # print "Ratio string:", repr(string), type(string)
        number = 0  # default value
        # First attempt to match ratio with regular expression
        for pattern in regex_patterns:
            # result = re.search(pattern, string)  # only the first match
            # if result:
            #     print "Match found for pattern:", pattern
            #     number = int(result.group(1))
            #     break  # Found a match, go get the cleaned up ratio number
            results = re.findall(pattern, string)  # all pattern matches
            if results:
                # print "Match found for pattern:", pattern
                # print results
                # Average each of the matches for this pattern
                sum = 0.0
                for result in results:
                    if isinstance(result, tuple):
                        # result = result[0]  # just use first value
                        # Average all the number groups matched in this pattern
                        tuple_sum = 0.0
                        for number in result:
                            tuple_sum += float(number)
                        tuple_avg = tuple_sum / len(result)
                        result = tuple_avg
                    # print result
                    sum += float(result)
                avg = sum / len(results)
                number = avg
                break  # Found a match, go get the cleaned up ratio number
            # else:
            #     print "No match found for pattern:", pattern
        else:  # Finally, after the for-loop tries all patterns
            print "No match found for ANY patterns for string:", repr(string)
        # Get the cleaned up ratio number
        ratios_clean.append(number)
        ratios[nurse] = number
        # print

    print "Ratios"
    print ratios

    print "Clean Ratios"
    print ratios_clean
    # print
    # print "ratios length: " + str(len(ratios))
    # print "ratios_clean length: " + str(len(ratios_clean))

    #Populate Records collection
    # nurse_count = data_frame.shape[0]
    # for nurse in range(nurse_count):
    # FIXME: TEMPORARY HACK TO DEAL WITH LESS data_frame
    for nurse in range(nurse_first, nurse_last):
        # print nurse
        education = data_frame[questions["education"]][nurse]
        salary = data_frame[questions["salary"]][nurse]
        experience = data_frame[questions["experience"]][nurse]
        department = data_frame[questions["department"]][nurse]
        patientNurseRatio = data_frame[questions["patientNurseRatio"]][nurse]

        # TODO: write comments
        if not isinstance(salary, int):
            salary = 20 #default, will change later
        if not isinstance(experience, int):
            experience = 0 #default, will change later
        if not isinstance(patientNurseRatio, int):
            patientNurseRatio = 0 #default, will change later

        doc = {
            "education": education,
            "salary": salary,
            "experience": experience,
            "department": department,
            "patientNurseRatio": patientNurseRatio
        }

        record_coll.insert(doc)

if __name__ == "__main__":
    main()
