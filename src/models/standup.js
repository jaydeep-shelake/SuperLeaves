const mongoose = require("mongoose")
const standupSchema = new mongoose.Schema({
 name:{type:String},
 creatorId:{type:String},
 users:[{
    name:{type:String},
    userId:{type:String},
    email:{type:String},
    avatar:{type:String}
 }],
 channelId:{type:String},
 quetions:[{
    quetion:{
        type:String,
    }
 },],
 weeks:[
   {
    text:{type:String},
    value:{type:String}
   }
 ],
 standUpTime:{type:String},
 firstAlert:{type:String},
 secondAlert:{type:String},
 messageViewType:{type:String,default:"questions"},
 msgTs:{type:String}
})

const Standup = mongoose.model("Standup",standupSchema)
module.exports=Standup

//["What did you complete yesterday?","What do you commit to today"," When do you think you'll be done with that","Any impediments in your way"]