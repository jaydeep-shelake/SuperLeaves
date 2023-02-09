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
    team:{
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

    admin:{
        type:Boolean,
        default:false
    },
    leaveCount:{
       type: [{
            type:{type:String},
            count:{type:Number},
        }],
       default:[
        {
            type:"earned leaves",
            count:15
        },
        {
            type:"sick leave",
            count:12
        },
        {
            type:"festive leaves",
            count:5
        },
        {
            type:"remote",
            count:8
        },
       ]
    }


})

const User = mongoose.model("User",userSchema)
module.exports=User