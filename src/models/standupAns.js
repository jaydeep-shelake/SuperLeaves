const mongoose = require("mongoose")
const standupAnsSchema = new mongoose.Schema({
  standupId:{type:String},
  creatorId:{type:String},
  standupName:{type:String},
  channelId:{type:String},
  date:{type:String},
  standUpTime:{type:String},
  allAns:[
    {
        userId:{type:String},
        ans:[
            {
                questionId:{type:String},
                question:{type:String},
                ans:{type:String},

            }
        ]
    }
  ]
})

const StandupAns = mongoose.model("StandupAns",standupAnsSchema)
module.exports=StandupAns