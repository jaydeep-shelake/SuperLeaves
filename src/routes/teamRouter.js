const express = require("express")
const teamRouter= express.Router()
const Team = require('../models/team')


teamRouter.get('/',async(req,res)=>{
  const slackId = req.query.slackId
  if(slackId){
    Team.find({"members.slackId":slackId})
    .then((result)=>{
      res.status(200).send(result)
    })
  }else{
    Team.find({}).then((result)=>{
      res.status(200).send(result)
  })
  }
    
})

teamRouter.get('/:id',async(req,res)=>{
    Team.findOne({name:req.params.id})
    .then((result)=>{
        res.send(result)
    })
})
teamRouter.delete('/:id',async(req,res)=>{
 Team.findByIdAndDelete(req.params.id)
 .then((id)=>{
    res.send(id)
 })
})

teamRouter.put('/',async(req,res)=>{
  Team.findByIdAndUpdate(req.body.teamId,{
    name:req.body.name,
    members:req.body.members,
    approvers:req.body.leads
  },{
    new:true
  })
  .then((result)=>{
    res.status(200).send(result)
  })
  
})

teamRouter.put('/addMember',async(req,res)=>{
const newUserInTeam=await Team.findOneAndUpdate({name:req.body.teamName},{
  $push:{
    members:{
      name:req.body.name,
      email:req.body.email,
      avatar:req.body.avatar,
      userId:req.body.userId
    }
  }
})
res.send(newUserInTeam)
})

teamRouter.post('/',async(req,res)=>{
    const newTeam = new Team({
        name:req.body.name,
        members:req.body.members,
        approvers:req.body.leads
    })
    newTeam.save()
    .then((result)=>{
     res.send(result)
    })
   
})

module.exports=teamRouter