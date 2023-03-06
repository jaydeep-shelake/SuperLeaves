const express = require("express")
const teamRouter= express.Router()
const Team = require('../models/team')
const User = require('../models/user')

teamRouter.get('/',async(req,res)=>{
  const slackId = req.query.slackId
  const teamName = req.query.teamName
  const admin = req.query.admin
  if(slackId){
    Team.findOne({"members.userId":slackId})
    .then((result)=>{
      res.status(200).send(result)
    
    })
  }
  else if(teamName){
    const PAGE_SIZE=15
    const page = parseInt(req.query.page || "0")
    
    User.find({team:teamName})
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE*page)
    .then((result)=>{
       const total = result.length
      res.status(200).send({users:result,toalPages:Math.ceil(total/PAGE_SIZE),userCount:total})
    })
  }
  else{
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

// single member
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
      let promises = [];
      for (i = 0; i < req.body.members.length; i++) {
        promises.push(
          User.findOneAndUpdate({userId:req.body.members[i].userId},{team:req.body.name},{new:true})
        )
      }
      Promise.all(promises)
      .then(()=>{
        res.send(result)
      })
      // team to user's profile

    })
   
})

module.exports=teamRouter