from os.path import join, dirname
import csv
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
def create_nurse_json(csv):
    nurse_info_list = [] #This will be my nurse JSON. Is a list of dictionaries. The keys are the questions (i.e. - salary?) and the values are
    # are dictionaries where the keys are incremental indices (0,1,..) and the values are the answers to the question for each nurse.
    index = 0
    nurse_questions, nurse_answers = {}, {}
    for line in csv:
        nurse_answers[index] = line.iloc[0,0]
        index += 1
    nurse_questions["What (City, State) are you located in?"] = nurse_answers
    nurse_info_list.append(nurse_questions)
    return nurse_info_list

def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['clipboardinterview']
    df = pd.read_csv(join(dirname(__file__), '../data/projectnurse.csv'), chunksize=1, header=None, encoding='utf-8')
    print create_nurse_json(df)



if __name__ == "__main__":
    main()
