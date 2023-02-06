const block = require('../payload')
const StandupAns = require("../models/standupAns")
const {dateConverter} = require('../converter');
const { callAPIMethodPost } = require("../api");
const Standup = require('../models/standup');
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

module.exports={
    showYesterdaysAns,
    skipStandup,
    skipDueToLeave
}