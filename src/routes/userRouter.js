const { default: axios } = require("axios")
const express = require("express")
const userRouter= express.Router()
const request = require("request")
const employees = require("../data")
const User = require("../models/user")

userRouter.get('/userlist',async(req,res)=>{
    const PAGE_SIZE=15
   const page = parseInt(req.query.page || "0")
   const total = await User.countDocuments({})

   const users=await User.find({})
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE*page)
    res.status(200).send({users,toalPages:Math.ceil(total/PAGE_SIZE),userCount:total})

    
})

userRouter.get('/userByEmail',async(req,res)=>{
    const {data}= await axios.get(`https://slack.com/api/users.lookupByEmail?email=${req.query.email}`,{
        headers: { Authorization: "Bearer " + process.env.SLACK_TOKEN  }
    })
    res.send(data)
})

userRouter.post('/add',async(req,res)=>{
   const newUser = new User({
    name:req.body.name,
    userId:req.body.userId,
    email:req.body.email,
    avatar:req.body.avatar,
    team:req.body.team,
    admin:req.body.admin
   })  
  const user = await newUser.save()
  res.send(user)
})

userRouter.get('/search',async(req,res)=>{
    let regEx = new RegExp(req.query.name,'i');
    const serachedUsers = await User.find({name:regEx})
    if(serachedUsers){
        res.send(serachedUsers)

    }else{
      res.status(402).send({message:'Opps No user found!!'})
    }
})

userRouter.get('/seed',async(req,res)=>{
  const newEmp= employees.map((emy)=>{
    return{
        name:emy.fullName,
        email:emy.email,
        avatar:emy.avatar,
        userId:emy.userId
    }
    })
    const {data}= await User.insertMany(newEmp)
    res.send({length:data.length,data})
})

module.exports=userRouter

// {"_id":{"$oid":"63bbb8fcddf5ee821259a1ea"},"userId":"U04CB3AHR3L","reamingLeavs":{"$numberInt":"0"},"approvedLeavs":{"$numberInt":"0"},"rejectedLeavs":{"$numberInt":"0"},"__v":{"$numberInt":"0"},"team":"Web","avatar":"https://avatars.slack-edge.com/2022-12-28/4584068446177_6a9a51188bd372a060f1_192.jpg","email":"jaydeep@ssup.co","name":"Jaydeep Shelake","teamId":"T38BC9NLD","userToken":"xoxp-110386328693-4419112603122-4593158698226-b9bb7a7e5713cdcf5c6ebd6e2398bfc7","earnedLeaves":{"$numberInt":"14"},"festiveLeaves":{"$numberInt":"5"},"remoteWork":{"$numberInt":"8"},"sickLeaves":{"$numberInt":"12"}}