from os.path import join, dirname
import csv
import json
import re
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
    client = MongoClient('mongodb://localhost:27017/')
    db = client['clipboardinterview']
    record_coll = db['records']

    #Create JSON of nurse info
    list_of_questions = ["What (City, State) are you located in?", "What's your highest level of education?", "Department", "How's the employee turnover?", "How many years of experience do you have?", "What is/was your length of orientation/training?", "What is the Nurse - Patient Ratio?", "What is your hourly rate ($/hr)?", "What's Your Shift Length?", "Which Shift?", "Other", "Full-Time/Part-Time?", "Do you have any special skills that set you apart from other nurses? (examples: CCRN, CNOR, Special Procedures, etc.)", "Would you recommend your department to another nurse?", "How did you hear about Project Nurse?", "Start Date (UTC)", "Submit Date (UTC)"]
    nurse_info_list = [] #This will be my nurse JSON. Is a list of dictionaries. The keys are the questions (i.e. - salary?) and the values are
    # are dictionaries where the keys are incremental indices (0,1,..) and the values are the answers to the question for each nurse.
    for column in range(17):
        df = pd.read_csv(join(dirname(__file__), '../data/projectnurse.csv'), chunksize=1)
        nurse_info_list.append(create_nurse_json(df, column, list_of_questions[column]))

    record_coll.drop()

    #Populate Records collection
    nurse_count = 347
    for nurse in range(nurse_count):
        education = nurse_info_list[1][list_of_questions[1]][nurse]
        salary = nurse_info_list[7][list_of_questions[7]][nurse]
        experience = nurse_info_list[4][list_of_questions[4]][nurse]
        department = nurse_info_list[2][list_of_questions[2]][nurse]
        patientNurseRatio = nurse_info_list[6][list_of_questions[6]][nurse]

        if type(salary) != int:
            salary = 0 #default, will change later
        if type(experience) != int:
            experience = 0 #default, will change later
        if type(patientNurseRatio) != int:
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
