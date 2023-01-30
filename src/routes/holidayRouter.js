const express = require("express")
const holidayRouter= express.Router()
const Holiday  = require("../models/holiday")
holidayRouter.get('/',async(req,res)=>{
    Holiday.find({}).then((result)=>{
    res.status(200).send(result)
   })
   
})
holidayRouter.post('/',async(req,res)=>{
    const newHoliday  = new Holiday({
        name:req.body.name,
        date:req.body.date
    })
     newHoliday.save().then((result)=>{
        res.status(200).send(result)
     })
    
})
module.exports=holidayRouter