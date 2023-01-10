const mongoose = require("mongoose")
const tokenSchema = new mongoose.Schema({
    accessToken:{
        type:String,
        required:true,
    },
    teamId:{
     type:String,
     default:""
    }
})
const Token = mongoose.model("Token",tokenSchema)
module.exports=Token