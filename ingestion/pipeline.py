from os.path import join, dirname
import csv
import json
import re
import math
from fractions import Fraction
import pandas as pd
import numpy as np
from pymongo import MongoClient
import zerorpc

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

"""

# Use regular expressions to get the number of patients a nurse sees (i.e. - if 5:1, get 5)
# for each nurse. Clean the patientNurseRatio column in CSV.
def clean_patient_nurse_ratio(nurse_count, data_frame_ratios): #Return a list of numbers (ratios)
    # Try out 3 Regex patterns. Get the first digit.
    # First Pattern ex. 3-4:1 -> Will return an average of 3 and 4
    # Second Pattern ex. 5:1 -> Will return 5
    # Third Pattern ex. 2:1 -> Will return 2
    regex_patterns = [r'(\d+)-(\d+)[:]', r'(\d+)[:]', r'(\d+)']
    clean_ratios = []

    for nurse in range(nurse_count):
        nurse_answer_string = data_frame_ratios[nurse]
        number = 0  # default ratio value

        # First attempt to match ratio with regular expression
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

# Do similar operation for the salaries
def clean_salaries_method(nurse_count, data_frame_salaries):
    regex_patterns = [r'[$](\d+)[.](\d+)', r'(\d+)[.](\d+)', r'[$](\d+)', r'(\d+)']
    clean_salaries = []

    for nurse in range(nurse_count):
        nurse_answer_string = data_frame_salaries[nurse]
        number = 0

        # First attempt to match salary with regular expression
        for pattern in regex_patterns:
            # all matches for current pattern

            results = re.findall(pattern, nurse_answer_string)
            if results:
                # print pattern
                if pattern == regex_patterns[0] or pattern == regex_patterns[1]: #for decimals (ie $25.67)
                    for index in range(len(results)):
                        power = len(results[index][1])
                        results[index] = float(results[index][0]) + float(results[index][1])/float(math.pow(10,power))

                # Average each of the matches for this pattern
                sum = 0.0
                for result in results:
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
                break
        else:  # Finally, after the for-loop tries all patterns
            print "No match found for ANY patterns for string:"
        clean_salaries.append(number)
        data_frame_salaries[nurse] = number # Update salaries column in data frame as it is cleaned
    return clean_salaries

# Do similar operation for the experience
def clean_experience_method(nurse_count, data_frame_experience):
    regex_patterns = [r'(\d+)-(\d+)', r'(\d+)[, ](\d+)', r'(\d+)[.](\d+)', r'(\d+)']
    clean_experience = []

    for nurse in range(nurse_count):
        nurse_answer_string = data_frame_experience[nurse]
        number = 0

        # First attempt to match salary with regular expression
        for pattern in regex_patterns:
            # all matches for current pattern

            results = re.findall(pattern, nurse_answer_string)
            if results:
                # print pattern
                if pattern == regex_patterns[2]: #for decimals (i.e. 1.6)
                    print "results for: "
                    print nurse_answer_string
                    for index in range(len(results)):
                        power = len(results[index][1])
                        results[index] = float(results[index][0]) + float(results[index][1])/float(math.pow(10,power))

                # Average each of the matches for this pattern
                sum = 0.0
                for result in results:
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
                break
        else:  # Finally, after the for-loop tries all patterns
            print "No match found for ANY patterns for string:"
        clean_experience.append(number)
        data_frame_experience[nurse] = number # Update salaries column in data frame as it is cleaned
    return clean_experience




def main():
    # Setup the database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['clipboardinterview']
    record_coll = db['records'] #change collection to nurses
    record_coll.drop()

    data_frame = pd.read_csv(join(dirname(__file__), '../data/projectnurse.csv'))

    # Replace all NaNs with empty string
    data_frame = data_frame.fillna('')

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

    #Number of nurses.
    nurse_count = data_frame.shape[0]

    #Get a list of all of the cleaned ratio answers
    ratios = data_frame[questions["patientNurseRatio"]]  # all of the ratios
    clean_ratios = clean_patient_nurse_ratio(nurse_count, ratios)

    #Get a list of all of the cleaned salary answers
    salaries = data_frame[questions["salary"]]  # all of the salaries
    clean_salaries = clean_salaries_method(nurse_count, salaries)

    #Get a list of all of the cleaned experience answers
    experience = data_frame[questions["experience"]]  # all of the experience values
    clean_experience = clean_experience_method(nurse_count, experience)




    #Populate Records collection
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
        print data_frame

if __name__ == "__main__":
    main()
