const express = require("express")
const { callAPIMethodPost, getUserInfo } = require("../api")
const Leave = require("../models/leave")
const LeaveType = require("../models/leaveType")
const User = require("../models/user")
const block = require("../payload")
const leavesRouter= express.Router()
const {getDaysDiff} = require('../helpers/helper')
const paginate = require("../helpers/pagination")


leavesRouter.get('/',async(req,res)=>{
  const userId = req.query.userId
  const leaveId  = req.query.leaveId
  const approverId = req.query.approverId
  const team = req.query.team
  try{
    if(userId){
      const allLeaves = await Leave.find({userId})
      res.status(200).send(allLeaves)
    }
    else if(approverId){
      const allLeaves = await Leave.find({approverId,approved:false}) //request
      res.status(200).send(allLeaves)
    }
    else if(team){
      const allLeaves = await Leave.find({team})
      res.status(200).send(allLeaves)
    }
    else if(leaveId){
      const leave =await Leave.findById(leaveId)
      res.status(200).send(leave)
    }
 
  }
  catch(e){
    res.status(500).send({error:"Something went wrong"})
  }
})

leavesRouter.get('/allLeavesReq',async(req,res)=>{
  try{
     const PAGE_SIZE=15
    const page = parseInt(req.query.page || "0")
    const data = await paginate(Leave,PAGE_SIZE,page)
    res.status(200).send(data)
  }
  catch(e){
  console.log("error while getting leaves",e)
  }
  
})

leavesRouter.get('/allLeavesType',async(req,res)=>{
    try {
      const leaveType= await LeaveType.find({})
      res.send(leaveType)
    } catch (error) {
       console.log(error)
    }
})

leavesRouter.post('/', async(req,res)=>{
  const approverRes = await callAPIMethodPost("conversations.open",req.body.teamId,{
    users:req.body.approver
  })
  const substituteRes = await callAPIMethodPost("conversations.open",req.body.teamId,{
    users:req.body.substitute
  })
 
       let subInfo
      const userInfo = await getUserInfo(req.body.slackId)
      const approverInfo = await getUserInfo(req.body.approver)
      if(subInfo&&subInfo.length>0){
        subInfo = await getUserInfo(req.body.substitute)
      }
  const newLeave = new  Leave({
    teamId:req.body.teamId,
    dateFrom:req.body.dateFrom,
    dateTo:req.body.dateTo,
    type:req.body.type, 
    desc:req.body.desc,
    userId:req.body.slackId,
    approverId:req.body.approver,
    substituteId:req.body.substitute,
    name:req.body.name,
    team:req.body.team,
    substituteName:subInfo.user.real_name,
    substituteAvatar:subInfo.user.profile.image_192,
    userAvatar:userInfo.user.profile.image_192,
    approverAvatar:approverInfo.user.profile.image_192,
    approverName:approverInfo.user.real_name,
   })
   await newLeave.save()
   .then(async(result)=>{
    const newDataApprover={
      teamId:req.body.teamId,
      dateFrom:req.body.dateFrom,
      dateTo:req.body.dateTo,
      type:req.body.type, 
      desc:req.body.desc,
      userId:req.body.slackId,
      approverId:req.body.approver,
      substituteId:req.body.substitute,
      requester:req.body.slackId,
      leaveId:result._id,
      channel:approverRes.channel.id,
      team:req.body.team,
      substituteName:subInfo.user.real_name,
      substituteAvatar:subInfo.user.profile.image_192,
       userAvatar:userInfo.user.profile.image_192,
        approverAvatar:approverInfo.user.profile.image_192,
        approverName:approverInfo.user.real_name,
    }
    await callAPIMethodPost("chat.postMessage",req.body.teamId,block.approve({metadata:newDataApprover}))
    .then((approveRes)=>{
       Leave.findByIdAndUpdate(result._id,{messageTs:approveRes.message.ts},{new:true})
       .then((data)=>res.status(200).send(data))
    })
    const newDataSubstitute={teamId:req.body.teamId,
      dateFrom:req.body.dateFrom,
      dateTo:req.body.dateTo,
      type:req.body.type, 
      desc:req.body.desc,
      userId:req.body.slackId,
      approverId:req.body.approver,
      substituteId:req.body.substitute,
     requester:req.body.slackId,
     leaveId:result._id,
     channel:substituteRes.channel.id,
     team:req.body.team
    }
    await callAPIMethodPost("chat.postMessage",req.body.teamId,block.substitute({metadata:newDataSubstitute}))
   })
   
})

leavesRouter.put('/',async(req,res)=>{
   const userId=req.body.userId
   const approverRes = await callAPIMethodPost("conversations.open","",{
    users: req.body.approver
  })
  const userRes = await callAPIMethodPost("conversations.open",req.body.teamId,{
    users:userId
  })
    Leave.findOneAndUpdate({messageTs:req.body.messageTs,userId},{approved:req.body.approved},{new:true})
    .then(async (result)=>{
      const diffDays = getDaysDiff(result.dateTo,result.dateFrom)+1
      await User.updateOne({userId:userId,"leaveCount.type":result.type},{$inc:{"leaveCount.$.count": - diffDays}})
      await callAPIMethodPost("chat.update",req.body.teamId,block.approved_message_block({...result,msgTs:req.body.messageTs,msg:"Approved",approverDesc:req.body.desc}))

      await callAPIMethodPost("chat.postMessage",req.body.teamId,block.rejected_approved({
        channel:userRes.channel.id,
        msg:"Approved 	:white_check_mark:",
        leave:result
      }))

     

      res.status(200).send(result)

      

    })   
})

leavesRouter.put('/cancelLeave/:id',async(req,res)=>{
  try{
    const canceledLeave = await Leave.findByIdAndUpdate(req.params.id,{canceled:true})
    res.send(canceledLeave)
  }
  catch{
    console.log("error while canceling leave",e)
  }
    
})

//TODO: reject leave route


//add leave type 

leavesRouter.post('/addLeaveType',async (req,res)=>{
  // await User.updateMany({},{$unset:{leaveCount:1}})
  const newLeaveType = new LeaveType({
    type:req.body.leaveName,
    noOfleaves:req.body.leaveCount
  })
  const leave=await newLeaveType.save()

  //add the new leave type to user document
  await User.updateMany({},{
    $push:{
      leaveCount:{
        type:req.body.leaveName,
        count:req.body.leaveCount
      }
    }
  })
  res.status(200).send(leave)
})

module.exports= leavesRouter