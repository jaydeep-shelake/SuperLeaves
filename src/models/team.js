
const mongoose = require("mongoose")
const newTeamSchema  = new mongoose.Schema({
    name:{
        type:"String",
        
    },
    approvers:[
        {
            name:{type:String},
            email:{type:String},
            avatar:{type:String},
            userId:{type:String} 
        }
    ],
    members:[
        {
            name:{type:String},
            email:{type:String},
            avatar:{type:String},
            userId:{type:String},
            leadOf:{type:String},
        }
    ]
})

const Team  = mongoose.model("Team",newTeamSchema)
module.exports=Team