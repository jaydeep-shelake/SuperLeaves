require('dotenv').config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const moment = require('moment');
const axios = require("axios")
const Leave = require("./models/leave")
let schedule = require('node-schedule');
const request = require("request")
const socket_io = require('socket.io')
const signature = require("./verifySignature");
const http = require('http')
const block = require("./payload")
const api = require("./api")
const { RTMClient } = require('@slack/rtm-api');
const {WebClient} = require("@slack/web-api")
const {createMessageAdapter} =require("@slack/interactive-messages");
const User = require('./models/user');
const Team = require('./models/team')
const leavesRouter = require('./routes/leavesRoute')
const userRouter = require('./routes/userRouter')
const teamRouter = require('./routes/teamRouter');
const holidayRouter = require('./routes/holidayRouter');
const Standup = require('./models/standup');
const standupRouter = require('./routes/standupRouter');
const StandupAns = require('./models/standupAns');
// const rtm = new RTMClient(process.env.SLACK_TOKEN);
const  web = new WebClient(process.env.SLACK_TOKEN)
const app = express()
const server = http.createServer(app)
const io= socket_io(server,{
  cors: {
    origins: ['http://localhost:8080']
  }
})
const PORT = process.env.PORT || 5000

app.use(express.json({extended: true }))  
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use('/api/leaves',leavesRouter)
app.use('/api/users',userRouter)
app.use('/api/team',teamRouter)
app.use('/api/holiday',holidayRouter)
app.use('/api/standup',standupRouter)
const scheduleCron =()=>{
  console.log("entered in cron")
 
  let rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, new schedule.Range(0, 6)];
  rule.hour = 1;
  rule.minute = 35;
  let timeZone = 'Asia/Kolkata';
  

  let j = schedule.scheduleJob(rule, function(){
    const currentDate = new Date().toISOString();
    console.log("current date",currentDate)
    Leave.find({dateFrom: { $lte: currentDate},
     dateTo: {$gte: currentDate }})
     .then(async(leaves)=>{
   
      if(leaves.length>0){
          leaves.forEach(async(item,i)=>{
            await api.callAPIMethodPost("users.profile.set","T38BC9NLD",{
              user:item.userId,
              profile:{
              
                    status_text:`PTO Till ${new Date(item.dateTo).toDateString()}`,
                    status_emoji:":palm_tree:",
                    status_expiration:0
                  }
            })
          })
            await api.callAPIMethodPost("chat.postMessage","T38BC9NLD",block.dailyNotification({leaves}))
          }
     })
    console.log('Running daily task at 1:35 AM IST');
  }.bind(null,timeZone));
}



// mongodb atlas connection 

mongoose.connect(process.env.MONGO_URI,
  err => {
      if(err) throw err;
      console.log('connected...')
      // scheduleCron()
      dailSatndupUpdate()
      // dailySatndupAnsPost()
  })
  

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

//toISOString()


//authentication of user which gives back the code and from code we can access the access token

app.post('/auth/callback', async (req, res) => {
 
  try{
    var data = {
      form: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.body.code
      }
    };
    request.post(
      "https://slack.com/api/oauth.v2.access",
      data,
      async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          // Save an auth token (and store the team_id / token)
         console.log(JSON.parse(body))
          const accessToken = JSON.parse(body).authed_user.access_token;
            console.log(accessToken)

          const identity = await web.users.identity({
            token: accessToken
        });
        console.log("identity",identity)
         const user  = await User.findOne({userId:identity.user.id})
          if(user){  //update existing user
           await User.findOneAndUpdate({userId:identity.user.id},{
              // workspace id
             userToken:accessToken, 
             teamId:identity.team.id,
              //user profile picture
             
           },{ new:true})
          } 
          else {  //user dose not exists add to db
          const newUser= new User({
            userId:identity.user.id,
            name:identity.user.name,
            teamId:identity.team.id,  
            userToken:accessToken, 
            avatar:identity.user.image_192
          })
          await newUser.save()
          }
         res.status(200).send({identity,token:accessToken});
        
          // At this point the user has logged in successfully with their account.
        }
      }
    );

      
  
      
  } catch (eek) {
      console.log(eek);
      res.status(500).send({err:ekk});
  }
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
function dailySatndupAnsPost(doc){
  let timeZone="Asia/Kolkata"
  console.log("came in posting mesage")
  const hour=doc.standUpTime.split(":")[0] // post one hour before
  const min=doc.standUpTime.split(":")[1]; // 30 12 * * *

  let j2 = schedule.scheduleJob(`${min} ${hour} * * *`,function(){
    const today = new Date();
    const offset = 330;  // IST offset is 5 hours and 30 minutes ahead of UTC
    const ISTTime = new Date(today.getTime() + offset * 60 * 1000);
    const date = ISTTime.toISOString().slice(0, 10);
 StandupAns.findOne({$and: [{date:date},{standupName:doc.name}]}).then(async(result)=>{
  console.log("result",result)
  if(result!==null){
   
      console.log("run at",hour,":",min)
      try{
        
        await web.chat.postMessage(block.daily_standup_ans({channelId:doc.channelId,quetions:doc.quetions,result}))

      }
      catch(error){
        console.log(`Error sending message  ${error}`)

      }
      
    ;
}
 })
}.bind(null,timeZone))
 //
}
function dailSatndupUpdate(){
  console.log("entered in job")
  let allStandUps=[]
  let timeZone = 'Asia/Kolkata';
  // finding daily standups at 10 am moring 
  let j2 = schedule.scheduleJob('0 10 * * *', function(){
    console.log("job run at",10,":",0)
    Standup.find({})
    .then((result)=>{
      allStandUps=result
      console.log('allStandsups',allStandUps)

      allStandUps.forEach((doc)=>{
       
        const hour=parseInt(doc.standUpTime.split(":")[0])-1 // post one hour before
        const min=doc.standUpTime.split(":")[1];
        // 30 12 * * *
        // this will be hour before on specifc standup time
          let j = schedule.scheduleJob(`${min} ${hour} * * *`, function(){
            
           console.log("message will be posting at",hour,":",min)
            doc.users.forEach(async(item)=>{
              try {
                const standupUserRes = await web.conversations.open({
                users:item.userId
                })
                await web.chat.postMessage(block.open_standup({userId:item.userId,name:doc.name,channel:standupUserRes.channel.id}))
                console.log("send msg to every one")
              } catch (error) {
                 console.log(`Error sending message to ${item}: ${error}`)
              }
             })
             dailySatndupAnsPost(doc)
            
          }.bind(null,timeZone));
        })
    })
    
    
    
  }.bind(null,timeZone));
 
   

  
     //this will run after one hour
   
  

    //TODO: Find out the stand up in db and and post message to every one in standup
    //TODO: Take the input before 30 min before and post theme on stand up time 
    //TODO: storing that inputs to db and posting theme on channel on specific time
}


function scheduleUpdateTheStatus(timeToUpdate,userId,teamId,dateTo){
  const unixTimestamp = timeToUpdate
  const scheduledTime = moment.unix(unixTimestamp);
  const currentTime = moment();

  if (scheduledTime.isBefore(currentTime)) {
    console.log("timestamp is in the past, job will not be scheduled");
    return;
}
const rule = new schedule.RecurrenceRule();
rule.year = scheduledTime.year();
rule.month = scheduledTime.month();
rule.date = scheduledTime.date();
rule.hour = scheduledTime.hour();
rule.minute = scheduledTime.minute();
rule.second = scheduledTime.second();

const j = schedule.scheduleJob(rule, async function(){
  // The code you want to run at the specified time goes here
  console.log("Running task at " + scheduledTime.toString());
  await api.callAPIMethodPost("users.profile.set",teamId,{
    user:userId,
    profile:{
    
          status_text:`PTO Till ${new Date(dateTo).toDateString()}`,
          status_emoji:":palm_tree:",
          status_expiration:0
        }
  })
});


}
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
      break;
     }
     case "user_status_changed":{ //TODO: when ever  user is on leaves and updates status it should automatically update back to on leaves
       // this will give unix time stamp 
      const userId=event.user.id
      const currentDate = new Date().toISOString();
      console.log("current date",currentDate)
      Leave.findOne({dateFrom: { $lte: currentDate},
       dateTo: {$gte: currentDate },userId})
       .then((leave)=>{
        const status_expire_time= event.user.profile.status_expiration
        if(leave!==null){
          console.log("user status update leave",leave)
          console.log(leave.userId,"has found in leaves and status will be updated ")
          scheduleUpdateTheStatus(status_expire_time,userId,leave.teamId,leave.dateTo)
        }
        
       })
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
    case "make_leave":  // action to create leave from home tab of app
      const date = new Date().toISOString().split("T")[0]; //setting up local date
       User.findOne({userId:payload.user.id})
      .then((user)=>{
        // console.log("user",user)
        const userTeam = "Web"
         Team.findOne({team:userTeam})
        .then(async(listOfMembers)=>{
          // console.log("list of members",listOfMembers)
          const members = listOfMembers.members
          // console.log("list of members",members)
          await api.callAPIMethodPost("views.open", teamId, {
            trigger_id: payload.trigger_id,
            view:block.request_leave({ date})
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
         
          
          if(metadata.type==="earned leaves"){
            await User.findOneAndUpdate({userId:metadata.user},{$inc: {'earnedLeaves':-1}})
          }
          if(metadata.type==="sick leaves"){
            await User.findOneAndUpdate({userId:metadata.user},{$inc: {'sickLeaves':-1}})
          }
          if(metadata.type==="festive leaves"){
            await User.findOneAndUpdate({userId:metadata.user},{$inc: {'festiveLeaves':-1}})
          }
          if(metadata.type==="remote"){
            await User.findOneAndUpdate({userId:metadata.user},{$inc: {' remoteWork':-1}})
          }

          await api.callAPIMethodPost("chat.update",teamId,{
            channel:metadata.channel,
            ts:payload.message.ts,
            text:"Thanks! Leave request is approved.",
            blocks:[]
          })
        
          const userRes = await api.callAPIMethodPost("conversations.open",teamId,{
            users: metadata.requester
          })
          
          await api.callAPIMethodPost("chat.postMessage",teamId,block.rejected_approved({
            channel:userRes.channel.id,
            msg:"Approved 	:white_check_mark:",
            leave:metadata
          }))
        

      
         
       })
       
      
      break;

    case "reject":
      console.log("payload from opprove block",payload)
      const rejectMetadata = JSON.parse(action.value).metadata
      console.log("metadata",rejectMetadata)
 
    
      await api.callAPIMethodPost("chat.update",teamId,{
        channel:rejectMetadata.channel,
        ts:payload.message.ts,
        text:"Thanks! Leave request is rejected",
        blocks:[]
      })

      
      const reUserRes = await api.callAPIMethodPost("conversations.open",teamId,{
        users: rejectMetadata.requester
      })

    
      await api.callAPIMethodPost("chat.postMessage",teamId,{
        channel:reUserRes.channel.id,
        msg:`Rejected :no_entry_sign: contact <@${rejectMetadata.approver}> for the reason`,
        leave:rejectMetadata
      })
      break;

    case "make_standup":

      const userRes = await api.callAPIMethodPost("conversations.open",teamId,{
        users: payload.user.id
      })
      await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.add_to_channel({channel:userRes.channel.id,userId:payload.user.id}))
      break;
    case "channel_select":
      const userId = payload.user.id
  
      const selectedChannel=  payload.actions[0].selected_conversation
      console.log(selectedChannel)
      const channelRes =  await api.getChannel(selectedChannel)
       console.log(channelRes)
      await api.callAPIMethodPost("views.open",teamId,{
        trigger_id:payload.trigger_id,
        view: block.standupModal({userId,selectedChannel,name:channelRes.channel.name,msgTs:payload.message.ts})
      })
      break;
    case "open_standup_dailog":
      const dialogmetadata= JSON.parse(action.value)
       const standupData= await Standup.findOne({name:dialogmetadata.name})
       
       await api.callAPIMethodPost("views.open",teamId,{
        trigger_id:payload.trigger_id,
        view: block.open_standup_dialog({...dialogmetadata,msgTs:payload.message.ts,standupId:standupData._id,creatorId:standupData.creatorId,quetions:standupData.quetions,standUpTime:standupData.standUpTime})
       })
       break;
      
       
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
         const team = await Team.findOne({"members.slackId":payload.user.id})
         console.log("existing user",existingUser)
         let leave = {
          dateFrom: dateFrom,
          dateTo: dateTo,
          type: values.leave_type.leave_type.selected_option.value,
          approver: values.approver.approver_id.selected_user,
          substitute:values.substitute.substitute_id.selected_user||null,
          user: payload.user.id,
          username:payload.user.name,
          desc: values.desc.desc.value || " ",
          showWarning,
          diffDays,
          team:team?team.name:""
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
            name:metadata.username,
            substituteId:metadata.substitute,
            team:metadata.team
           })
            await newLeave.save(async(err,result)=>{
            console.log(result._id)
             console.log("saved to db")
             // send direct message to approver
        const resChannel = await api.callAPIMethodPost("conversations.open",payload.team.id,{
          users:metadata.approver
        })
       console.log(resChannel)
       
        
        

         const newData= {...metadata,channel:resChannel.channel.id,requester:payload.user.id,leaveId:result._id,team:metadata.team}
         console.log("newData",newData)

        await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.approve({metadata:newData}))
        .then(async(result)=>{
         await Leave.findOneAndUpdate({userId:payload.user.id},{messageTs:result.message.ts},{new:true})
        })

        if(metadata.substitute!==null){
        const resSubstitute = await api.callAPIMethodPost("conversations.open",payload.team.id,{
          users:metadata.substitute
        })
        const newSubData ={...metadata,channel:resSubstitute.channel.id,requester:payload.user.id,leaveId:result._id,team:metadata.team}
        // //send direct message to substitute
        await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.substitute({metadata:newSubData}))
        }

           })
          
        
        
         // show the done modal after conforming the leave
            return res.send(block.finish_leave())   
    case "request_standup":
      const standupmetadata = JSON.parse(payload.view.private_metadata) // preious value
      const standupUsers = payload.view.state.values.standup_users.standup_user_id.selected_users  // array of users 
      const selectedWeek = payload.view.state.values.week_type.days_in_week.selected_options.map((item)=>{
        return{
          text:item.text.text,
          value:item.value
        }
      })
      const selectedTime =  payload.view.state.values.standup_time.daily_time.selected_option.value

     
      let users = [];
      let promises = [];
      for (i = 0; i < standupUsers.length; i++) {
        promises.push(
          api.getUserInfo(standupUsers[i]).then(response => {
            users.push({userId:response.user.id,name:response.user.real_name,email:response.user.profile.email,avatar:response.user.profile.image_192});
          })
        )
      }
     
      Promise.all(promises).then(async() =>{
        const newStandUp = new Standup({
          name:standupmetadata.name,
          users,
          channelId:standupmetadata.selectedChannel,
          weeks:selectedWeek,
          standUpTime:selectedTime,
          creatorId:payload.user.id,
          quetions:[{quetion:"What did you complete yesterday?"},{quetion:"What do you commit to today"},{quetion:" When do you think you'll be done with that"},{quetion:"Any impediments in your way"}],
          url:"http://localhost:8080/standup"
        })
        await newStandUp.save()
        await api.joinChannel(payload.team.id,standupmetadata.selectedChannel)
        await api.callAPIMethodPost("chat.postMessage",payload.team.id,block.post_standup_message({name:standupmetadata.name,
          users,
          channelId:standupmetadata.selectedChannel,
          weeks:selectedWeek,
          standUpTime:selectedTime,
          quetions:[{quetion:"What did you complete yesterday"},{quetion:"What do you commit to today"},{quetion:" When do you think you'll be done with that"},{quetion:"Any impediments in your way"}],
          url:"http://localhost:8080/standup"}))
         
        return res.send(block.finish_standup())
       
      } );    
        
    case "post_answers_standup":
       const ansmetadata = JSON.parse(payload.view.private_metadata)
      //  console.log("ans metadata",ansmetadata)
       const user=payload.user.id
       const allAnsValue =payload.view.state.values
       const arrayOfAns = Object.values(allAnsValue) // converted objects to array
       const arrayOfAnsOnly = arrayOfAns.map(obj => Object.values(obj)[0].value)
       const newDate = new Date();
          const offset = 330;  // IST offset is 5 hours and 30 minutes ahead of UTC
          const ISTTime = new Date(newDate.getTime() + offset * 60 * 1000);
          const date = ISTTime.toISOString();
         const existingStandup= await StandupAns.findOne({standupName:ansmetadata.name,date:date.slice(0, 10)})
         if(existingStandup){
          await StandupAns.updateOne({standupName:ansmetadata.name},{$addToSet:{
            allAns:{userId:user,ans:ansmetadata.quetions.map((item,i)=>{
              return{
                questionId:item._id,
                question:item.quetion,
                ans:arrayOfAnsOnly[i],
                
              }
           })}
          }})
         }
         else{
          const today = new Date();
          const offset = 330;  // IST offset is 5 hours and 30 minutes ahead of UTC
          const ISTTime = new Date(today.getTime() + offset * 60 * 1000);
          const date = ISTTime.toISOString();
          const newStandupAns = new StandupAns({
            standupId:ansmetadata.standupId,
            creatorId:ansmetadata.creatorId,
            channelId:ansmetadata.selectedChannel,
            standupName:ansmetadata.name,
            standUpTime:"",
            date:date.slice(0, 10),
            allAns:[{userId:user,ans:ansmetadata.quetions.map((item,i)=>{
               return{
                 questionId:item._id,
                 question:item.quetion,
                 ans:arrayOfAnsOnly[i],
                 
               }
            })}] 
           })
   
           await newStandupAns.save()
         }
        
        return res.send(block.finish_standup())
              
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

io.on('connection', function (socket) {
  console.log('socket connection');
  const token =socket.handshake.auth.token;
  const userId =socket.handshake.auth.slackId;
 

  const leaveWatcher = Leave.watch()
leaveWatcher.on('change',(change)=>{
     Leave.find({userId:userId})
     .then((result)=>{
      console.log(result)
       io.emit('changeData',result);
     })

     Leave.find({approverId:userId,approved:false})
     .then((result)=>{
      io.emit('changeApproverData',result)
     })
})
  
});

var socket = io;
module.exports = socket;

  // Start the built-in server
  
server.listen(PORT,()=>{
  console.log("server running",PORT)
 
})

