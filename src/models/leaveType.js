const mongoose = require('mongoose')
const leaveTypeSchema = new mongoose.Schema({
    type:{type:String},
    noOfleaves:{type:Number}
})
const LeaveType = mongoose.model("leaveType",leaveTypeSchema)
module.exports=LeaveType
