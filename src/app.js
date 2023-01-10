require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const Leave = require("./models/leave")
const request = require("request")
const signature = require("./verifySignature");
const block = require("./payload")
const api = require("./api")
const { RTMClient } = require('@slack/rtm-api');
const {WebClient} = require("@slack/web-api")
const {createMessageAdapter} =require("@slack/interactive-messages");
const User = require('./models/user');
const Team = require('./models/team')
// const token="xoxb-110386328693-4595622241604-XdthEv8lYi2on8XRpBMLopjY"
// const rtm = new RTMClient(process.env.SLACK_TOKEN);
// const  web = new WebClient(process.env.SLACK_TOKEN)
// const interaction = createMessageAdapter(process.env.SLACK_SIGNING_SECRET)
const app = express()
const PORT = process.env.PORT || 3000
app.use(express.json({extended: true }))  
app.use(express.urlencoded({extended:true}))

// mongodb atlas connection 

mongoose.connect(process.env.MONGO_URI,
  err => {
      if(err) throw err;
      console.log('connected...')
  });

// rtm.start()
// .catch(e=>console.log(e))

// rtm.on("ready",async()=>{
//   console.log("bot srated") 
//   // sendMessage("Hi SuperBotHere","#web-test") 
// })
// rtm.on("slack_event",(eventType,event)=>{

  
//   if (event && event.type === 'message'){
//     if (event.text === '!apply') {
        
//         applyForLeave(event.channel,event.user)
//     }
// }

//  if(event.tab==="home"){
//   console.log("home tab opened by",event.user)
//     // updateHomePage(event.channel,event.user)
//  }
// })


//authentication of app 


app.get("/auth", function (req, res) {
  if (!req.query.code) {
    // access denied
    console.log("Access denied");
    return;
  }

  var data = {
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code
    }
  };
  request.post(
    "https://slack.com/api/oauth.v2.access",
    data,
    async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        // Save an auth token (and store the team_id / token)
        const teamId = JSON.parse(body).team.id;
        const accessToken = JSON.parse(body).access_token;
        console.log("accessToken ",accessToken)
        await api.saveCredential(teamId, accessToken);
        // const cred = await db.getCredential(teamId);
        // if (cred != null){
        //   scheduleCron(cred);
        // }

        res.redirect("https://slack.com/app_redirect?app=A04HC62CWLV");
      }
    }
  );
});




//event

app.post('/events',(req,res)=>{
  console.log("challenge",req.body.challenge)

  switch (req.body.type) {
    case "url_verification": {
      // verify Events API endpoint by returning challenge if present
      return res.send({ challenge: req.body.challenge });
    }

    case "event_callback": {
     console.log("Team Id",req.body.team_id)
     console.log("event",req.body.event)
     handleEvent(req.body.event,req.body.team_id)
    
    }
    default:{
      return res.status(404).send()
    }
  }

})

// handle event  when user makes interactivity with app

const handleEvent = async (event, teamId) => {
  console.log("event",event)
  console.log("teamid",teamId)
   switch(event.type){
     case "app_home_opened":{
      if(event.tab==="home"){
        updateHomePage(event,teamId)
      }
      else if(event.tab==="messages"){
        console.log(event)
      }
      
     }
   }

}



//interaction event 

app.post("/interactions",async(req,res)=>{
  // if (!signature.isVerified(req)) return res.status(400).send();
  
  
  const payload = JSON.parse(req.body.payload);
  console.log("/interaction payload",payload)
  const teamId = payload.team.id;
  if(payload.type === "block_actions"){
  let action = payload.actions[0];
  switch (action.action_id) {
    case "make_leave":
      const date = new Date().toISOString().split("T")[0]; //setting up local date
       User.findOne({userId:payload.user.id})
      .then((user)=>{
        // console.log("user",user)
        const userTeam = user.team
         Team.findOne({team:userTeam})
        .then(async(listOfMembers)=>{
          // console.log("list of members",listOfMembers)
          const members = listOfMembers.members
          // console.log("list of members",members)
          await api.callAPIMethodPost("views.open", teamId, {
            trigger_id: payload.trigger_id,
            view:block.request_leave({ date,members})
          });
        })
       
      })
      
      
    break;
    case "view_analytics":
      const leaveData = JSON.parse(payload.view.private_metadata)
      console.log("leave data",leaveData)
      await api.callAPIMethodPost("views.open",teamId,{
        trigger_id:payload.trigger_id,
        view: block.viewAnalytics(leaveData)
      })
      // await  web.views.open({
      //   trigger_id:payload.trigger_id,
      //   view: block.viewAnalytics(leaveData)
      // })
      break;
    case "approve":
      console.log("payload from opprove block",payload)
      const metadata = JSON.parse(action.value).metadata
       console.log("metadata",metadata)
        Leave.findOneAndUpdate({_id:metadata.leaveId},{approved:true},{new:true})
       .then(async ()=>{
          // update the chat of aprrove and reject button when the approver clicks any button
          console.log("updated")
          await api.callAPIMethodPost("chat.update",teamId,{
            channel:metadata.channel,
            ts:payload.message.ts,
            text:"Thanks! Leave request is approved.",
            blocks:[]
          })
          // const tsRes= await web.chat.update({
          //   channel:metadata.channel,
          //   ts:payload.message.ts,
          //   text:"Thanks! Leave request is approved.",
          //   blocks:[]
          // })
          // console.log("ts res",tsRes)
          // console.log("ts res block",tsRes.message.blocks)


          // send the message to user if his request is approved or not 
          // const userRes= await web.conversations.open({
          //   users: metadata.requester
          // })
          const userRes = await api.callAPIMethodPost("conversations.open",teamId,{
            users: metadata.requester
          })
          // await web.chat.postMessage(block.rejected_approved({
          //   channel:userRes.channel.id,
          //   msg:"Approved 	:white_check_mark:",
          //   leave:metadata
          // }))
          await api.callAPIMethodPost("chat.postMessage",teamId,block.rejected_approved({
            channel:userRes.channel.id,
            msg:"Approved 	:white_check_mark:",
            leave:metadata
          }))
          // update the profile status
          // await web.users.profile.set({
          //   profile:{
          //     status_text:`PTO Till ${metadata.dateTo}`,
          //     status_emoji:":palm_tree:",
          //     status_expiration:0
          //   }
          // })
          await api.callAPIMethodPost("users.profile.set",teamId,{
            profile:{
                  status_text:`PTO Till ${metadata.dateTo}`,
                  status_emoji:":palm_tree:",
                  status_expiration:0
                }
          })
       })
       
      
      break;

    case "reject":
      console.log("payload from opprove block",payload)
      const rejectMetadata = JSON.parse(action.value).metadata
      console.log("metadata",rejectMetadata)
 
      

      // await web.chat.update({
      //   channel:rejectMetadata.channel,
      //   ts:payload.message.ts,
      //   text:"Thanks! Leave request is rejected",
      //   blocks:[]
      // })

      await api.callAPIMethodPost("chat.update",teamId,{
        channel:rejectMetadata.channel,
        ts:payload.message.ts,
        text:"Thanks! Leave request is rejected",
        blocks:[]
      })

      // const reUserRes=await web.conversations.open({
      //   users: rejectMetadata.requester
      // })
      const reUserRes = await api.callAPIMethodPost("conversations.open",teamId,{
        users: rejectMetadata.requester
      })

      // await web.chat.postMessage(block.rejected_approved({
      //   channel:reUserRes.channel.id,
      //   msg:`Rejected :no_entry_sign: contact <@${rejectMetadata.approver}> for the reason`,
      //   leave:rejectMetadata
      // }))

      await api.callAPIMethodPost("chat.postMessage",teamId,{
        channel:reUserRes.channel.id,
        msg:`Rejected :no_entry_sign: contact <@${rejectMetadata.approver}> for the reason`,
        leave:rejectMetadata
      })

  }
}
else if(payload.type==="view_submission"){
   return handleViewSubmission(payload,res,teamId)
}
})

const  handleViewSubmission=async (payload,res,teamId)=>{
   console.log("Top payload",payload)
  //action when user click on next button when modal is open
  switch (payload.view.callback_id) {
    case"request_leave":
        const values = payload.view.state.values;
         console.log("values",values)
        // const dateNow = new Date().setHours(0, 0, 0, 0);
        let today = new Date()
        const dateFrom = new Date(values.date_from.date_from.selected_date);
        const dateTo = new Date(values.date_to.date_to.selected_date);
        const diffTime =  Math.abs(today-dateFrom)
        console.log("diff",diffTime)
        const diffDays = Math.ceil(diffTime/(1000*60*60*24))
        const showWarning = diffDays <= 15
        console.log("date diffrence",diffDays,"waring: ",showWarning)
         //checking if user alredy exits or not
         const existingUser = await User.findOne({userId:payload.user.id})
         console.log("existing user",existingUser)
         let leave = {
          dateFrom: dateFrom,
          dateTo: dateTo,
          type: values.leave_type.leave_type.selected_option.value,
          approver: values.approver.approver_id.selected_user,
          substitute:values.substitute.substitute_id.selected_user|| "No substitute",
          user: payload.user.id,
          desc: values.desc.desc.value || " ",
          showWarning,
          diffDays
        };
         if(existingUser){
          if(showWarning){
            return res.send(block.confirm_leave_warning({leave}))
          }
          else{
            return res.send(block.confirm_leave({leave}))
          } 
          
         }
         else{
          const newUser = new User({
            userId:payload.user.id,
          })
          await newUser.save().then(()=>console.log("user saved"))
          .catch(e=>console.log("error at saving user",e))
          if(showWarning){
            return res.send(block.confirm_leave_warning({leave}))
          }
          else{
            return res.send(block.confirm_leave({leave}))
          } 

         }
        //respond with a stacked modal to the user to confirm selection
        


    case "confirm_leave":
        // console.log("confirm Leaves", payload.view.private_metadata)
       
        console.log("payload confirm Leaves",payload)
         const metadata= JSON.parse(payload.view.private_metadata)
         console.log("metadata from confirm",metadata)
      
          const newLeave = new  Leave({
            teamId:payload.team.id,
            dateFrom:metadata.dateFrom,
            dateTo:metadata.dateTo,
            type:metadata.type, // leave type (vaction, scik , eraned leaves)
            desc:metadata.desc,
            userId:metadata.user,
            approverId:metadata.approver,
           })
            await newLeave.save(async(err,result)=>{
            console.log(result._id)
             console.log("saved to db")
             // send direct message to approver
        // const resChannel = await web.conversations.open({  // aprover conversation open
        //   users:metadata.approver
        // })
        const resChannel = await api.callAPIMethodPost("conversations.open",payload.team.id,{
          users:metadata.approver
        })
       console.log(resChannel)
        // const resSubstitute = await web.conversations.open({ // substitute conversation open
        //   users:metadata.substitute
        // })
        const resSubstitute = await api.callAPIMethodPost("conversations.open",payload.team.id,{
          users:metadata.substitute
        })
        console.log("This is conversation response",resSubstitute)

         const newData= {...metadata,channel:resChannel.channel.id,requester:payload.user.id,leaveId:result._id}
         console.log("newData",newData)

        // await web.chat.postMessage(block.approve({metadata:newData}))
        await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.approve({metadata:newData}))

        const newSubData ={...metadata,channel:resSubstitute.channel.id,requester:payload.user.id,leaveId:result._id}
        // //send direct message to substitute
        // await web.chat.postMessage(block.substitute({metadata:newSubData}))
        await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.substitute({metadata:newSubData}))


           })
          
        
        
         // show the done modal after conforming the leave
        return res.send(block.finish_leave())      
  }
}

// funnction to update home tab when user clicks on home tab of app

async function updateHomePage(event,teamId){
     // finding the user's data 
  const userdata= await Leave.find({userId:event.user}) // must be an array
  const totalRemainingLeaves = 32 - userdata.length
  const earnedLeaves = userdata.filter(leave=>leave.type==='earned leaves'&&leave.approved)
  const sickLeaves = userdata.filter(leave=>leave.type==='sick'&&leave.approved)
  const festiveLeaves = userdata.filter(leave=>leave.type==="festive"&&leave.approved)
  const totalRemainingSickLeaves = 12 - sickLeaves.length
  const totalRemaingEarnedLeaves = 15 - earnedLeaves.length
  const totalRemaingFestiveLeaves = 5 - festiveLeaves.length
  console.log(totalRemaingEarnedLeaves,totalRemainingSickLeaves,totalRemaingFestiveLeaves)
  // const userInfo = await User.findOne({userId:event.user})
  console.log(userdata)
  if(userdata){
    await api.callAPIMethodPost("views.publish",teamId,{
      user_id:event.user,
      view:block.welcome_message_testing({userId:event.user,earned:totalRemaingEarnedLeaves,festive:totalRemaingFestiveLeaves,sick:totalRemainingSickLeaves,total:totalRemainingLeaves})
 
    })
  //  await web.views.publish({
  //    user_id:event.user,
  //    view:block.welcome_message_testing({userId:event.user,earned:totalRemaingEarnedLeaves,festive:totalRemaingFestiveLeaves,sick:totalRemainingSickLeaves,total:totalRemainingLeaves})
  //  })
  }
}

  // Start the built-in server
  
app.listen(PORT,()=>{
  console.log("server running",PORT)
})
  // Log a message when the server is ready

