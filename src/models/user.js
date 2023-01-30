const mongoose = require("mongoose")
const userSchema  = new mongoose.Schema({
    userId:{
        type:String,
        unique:true
    },
    name:{
        type:String,
        default:" ",
    },
    email:{
     type:String,
     default:" ",
    },
    teamId:{
    type:String,
    default:" "
    },
    avatar:{
     type:String,
     default:" "
    },
    userToken:{
        type:String,
        default:" ",
    },
    earnedLeaves:{
        type:Number,
        default:15,
    },
    sickLeaves:{
        type:Number,
        default:12,
    },
    festiveLeaves:{
        type:Number,
        default:5
    },
    remoteWork:{
        type:Number,
        default:8
    }


})

const User = mongoose.model("User",userSchema)
module.exports=User