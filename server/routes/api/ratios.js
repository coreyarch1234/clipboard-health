import Record from '../../models/Record';



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
