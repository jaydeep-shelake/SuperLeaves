const mongoose = require("mongoose")
const userSchema  = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    remainingLeavs:{
        type:Number,
        default:32,
    },
    totalEranedLevaRemaining:{
        type:Number,
        default:15,
    },
    totalSickLevaRemaining:{
        type:Number,
        default:12,
    },
    totalFestiveLevaRemaining:{
        type:Number,
        default:5,
    },
    approvedLeavs:{
        type:Number,
        default:0,
    },
    rejectedLeavs:{
        type:Number,
        default:0,
    },
    team:{
        type:String,
        default:"web"
    }

})

const User = mongoose.model("User",userSchema)
module.exports=User