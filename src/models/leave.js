const mongoose = require("mongoose")
const leaveSchema = new mongoose.Schema({
    teamId:{
        type:String,
       
    },
    name:{
        type:String
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
    substituteId:{
       type:String,
       default:""
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
        default:"Web"
    },
    messageTs:{
        type:String
    },
    approversDesc:{
        type:String
    }
},{timestamps:true})

const Leave = mongoose.model("Leave",leaveSchema)
module.exports=Leave

