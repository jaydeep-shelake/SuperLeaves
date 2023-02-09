const express = require("express")
const Standup = require("../models/standup")
const StandupAns = require("../models/standupAns")
const standupRouter= express.Router()


standupRouter.get('/',async(req,res)=>{
   const result= await Standup.find({creatorId:req.query.userId})
   res.status(200).send(result)
})

standupRouter.get('/:id',async(req,res)=>{
  const result = await Standup.findById(req.params.id)
  const ansResult = await StandupAns.findOne({standupId:req.params.id})
  res.send({standup:result,standupans:ansResult})
})

standupRouter.put('/:id',async(req,res)=>{
  const result = await Standup.findByIdAndUpdate(req.params.id,{
    quetions:req.body.questions,
    users:req.body.users,
    standUpTime:req.body.time,
    messageViewType:req.body.messageViewType
  },{
    new:true
  })
  res.send(result)
})
module.exports=standupRouter