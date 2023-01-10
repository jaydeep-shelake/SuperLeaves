const mongoose = require("mongoose")
const leaveSchema = new mongoose.Schema({
    teamId:{
        type:String,
       
    },
    dateFrom:{
        type:String,
        
    },
    
    dateTo:{
        type:String,
       
    },
    type:{
        type:String,
        default:""
    },
    desc:{
        type:String,
        default:""
    },
    userId:{
        type:String,
        
        
    },
    approverId:{
        type:String,
        
    },
    approved:{
    type:Boolean,
    default:false
    },
    canceled:{
        type:Boolean,
        default:false 
    },
    rejected:{
        type:Boolean,
        default:false 
    },
    team:{
        type:String,
        default:"web"
    }
})

const Leave = mongoose.model("Leave",leaveSchema)
module.exports=Leave

