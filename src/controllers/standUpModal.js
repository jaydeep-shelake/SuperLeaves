const block = require('../payload')
const StandupAns = require("../models/standupAns")
const {dateConverter} = require('../converter');
const { callAPIMethodPost, getChannel } = require("../api");
const Standup = require('../models/standup');
const { getUsersInfo } = require('../helpers/bot');
async function showYesterdaysAns(payload,action){
    const nowDate = new Date()
    const yesterday=nowDate.setDate(nowDate.getDate() - 1);
    const yesterDaysDate = dateConverter(new Date(yesterday))
    const metadata = JSON.parse(payload.view.private_metadata)
    let blocks = []
    const quetions = metadata.quetions
   
    
    console.log(yesterDaysDate.slice(0,10))
    console.log("action",action)
      if(action.selected_options.length>0){ //user checked the checkbox
       const standupAns=await StandupAns.findOne({standupName:metadata.name,allAns: {$elemMatch: {userId:payload.user.id,skip:false}}})
       .sort({date:-1}).limit(1)
       
       if(standupAns!==null){
       const usersAns= standupAns.allAns.find((item)=>item.userId===payload.user.id)
        // TODO: if user ans are undifine (no ans found) return the different block
       quetions.forEach((quetion,i)=>{
        blocks.push({
              
          block_id: `desc_${quetion._id}`,
          type: "input",
          label: {
            type: "plain_text",
            text: `${quetion.quetion} ?`
          },
          optional: false,
          element:{
            action_id: `desc_${quetion._id}`,
            type: "plain_text_input",
            max_length: 600,
            initial_value:"",
            placeholder: {
              type: "plain_text",
              text:"required"
            },
            multiline: true
          },
    
        })
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: usersAns.ans[i].ans
        }
      })
  
       })
       console.log("action.selected_options from if",action.selected_options)
       await callAPIMethodPost("views.update","",block.open_standup_dialog({...metadata,view_id:payload.view.id,update:"true",blocks}))
      }
      else{
        await callAPIMethodPost("views.update","",block.open_standup_dialog({...metadata,view_id:payload.view.id,update:"false"}))
      }
      }
      else{ //user unchecked checkbox
        console.log("action.selected_options from else",action.selected_options)

        await callAPIMethodPost("views.update","",block.open_standup_dialog({...metadata,view_id:payload.view.id,update:"false"}))
      }
}

async function skipStandup(payload){
  const skipMetadata=JSON.parse(payload.actions[0].value)
  const msgTs = payload.message.ts
  const user = payload.user.id
  const date = dateConverter(new Date())
  const existingStandup= await StandupAns.findOne({standupName:skipMetadata.name,date:date.slice(0, 10)})
  const standup = await Standup.findOne({name:skipMetadata.name})
  // add users ans value to skip is true and update the message
  if(existingStandup!==null){
  await StandupAns.updateOne({standupName:skipMetadata.name,date:date.slice(0, 10)},{$addToSet:{
    allAns:{userId:user,ans:[],skip:true}
  }})
}
else{
  const newStandupAns = new StandupAns({
    standupId:standup._id,
    creatorId:standup.creatorId,
    standupName:skipMetadata.name,
    date:date.slice(0, 10),
    allAns:[{userId:user,ans:[],skip:true}] 
   })
   
   await newStandupAns.save()
  
}
await callAPIMethodPost("chat.update","",{
  channel:skipMetadata.channel,
  ts:msgTs,
  text:"Thanks! *You Skipped the todays standup*",
  blocks:[]
})

}

async function skipDueToLeave(payload){
 const leaveMetaData=JSON.parse(payload.actions[0].selected_option.value)

 const msgTs = payload.message.ts
  const user = payload.user.id
  const date = dateConverter(new Date())
  const existingStandup= await StandupAns.findOne({standupName:leaveMetaData.name,date:date.slice(0, 10)})
  const standup = await Standup.findOne({name:leaveMetaData.name})
  // add users ans value to skip is true and update the message
  if(existingStandup!==null){
  await StandupAns.updateOne({standupName:standup.name,date:date.slice(0, 10)},{$addToSet:{
    allAns:{userId:user,ans:[],leave:true}
  }})
}
else{
  const newStandupAns = new StandupAns({
    standupId:standup._id,
    creatorId:standup.creatorId,
    standupName:standup.name,
    date:date.slice(0, 10),
    allAns:[{userId:user,ans:[],leave:true}] 
   })
   
   await newStandupAns.save()

   await callAPIMethodPost("chat.update","",{
    channel:payload.channel.id,
    ts:msgTs,
    text:"Thanks! *Team will be notify that you are on leave*",
    blocks:[]
  })
}
}

async function editChanel(payload,action){
 
  const action_data = JSON.parse(action.value)
 await callAPIMethodPost("views.open","", {
    trigger_id: payload.trigger_id,
    view: block.edit_channel({channelId:action_data.channelId})
  });
}

async function submitEditedChannel(payload,res){
   const selectedChannel = payload.view.state.values.select.channel_select_edit.selected_conversation
   const channelRes = await getChannel(selectedChannel);
   const oldChannel = JSON.parse(payload.actions.value).standupId
  const channelName = channelRes.channel.name
  await Standup.findOneAndUpdate({_id:oldChannel},{name:channelName,channelId:channelRes.channel.id},{new:true})
  return res.send(block.successModal("Channel updated successfuly !"))
}

async function editUsers(payload,action){
  const action_data = JSON.parse(action.value)
  console.log("action data",action_data)
  const standup = await Standup.findOne({name:action_data.standupId})
  const userIds = standup.users.map((user)=>user.userId)
   await callAPIMethodPost("views.open","", {
    trigger_id: payload.trigger_id,
    view: block.edit_users({users:userIds,standupId:action_data.standupId})
  });
}

async function updateUsers(payload,res){
  const metadata = JSON.parse(payload.view.private_metadata)
 const users= payload.view.state.values.standup_users.standup_user_id.selected_users
  const usersInfo = await getUsersInfo(users)
  await Standup.findOneAndUpdate({_id:metadata.standupId},{users:usersInfo},{new:true})
  .then((standup)=>{
   console.log("standup",standup)
    callAPIMethodPost("chat.update"," ",block.post_standup_message_edited({...standup,standupId:standup._id}))
  })
  
  return res.send(block.successModal("Users updated successfuly !"))
}

module.exports={
    showYesterdaysAns,
    skipStandup,
    skipDueToLeave,
    editChanel,
    submitEditedChannel,
    editUsers,
    updateUsers
}