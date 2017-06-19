import React from 'react';

//React Nurse Profile
const Profile = (nurse) => (
    <div className="NursePreview">
    <br/>
        <div>
            <h2>Department: </h2>
            <h3>{nurse.department}</h3>
        </div>
        <div>
            <h2>Education: </h2>
            <h3>{nurse.education}</h3>
        </div>
        <div>
            <h2>Experience: </h2>
            <h3>{nurse.experience}</h3>
        </div>
        <div>
            <h2>Patient Ratio: </h2>
            <h3>{nurse.patientNurseRatio}</h3>
        </div>
        <div>
            <h2>Salary: </h2>
            <h3>{nurse.salary}</h3>
        </div>
    </div>
);
export default Profile
