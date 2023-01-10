
const mongoose = require("mongoose")
const newTeamSchema  = new mongoose.Schema({
    team:{
        type:"String",
        default:"web"
    },
    approver:{
        type:"String"
    },
    members:{
        type:Array,
        default:[]
    }
})

const Team  = mongoose.model("Team",newTeamSchema)
module.exports=Team