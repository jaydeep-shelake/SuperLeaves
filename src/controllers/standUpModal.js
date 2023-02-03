const block = require('../payload')
const StandupAns = require("../models/standupAns")
const {dateConverter} = require('../converter');
const { callAPIMethodPost } = require("../api");
async function showYesterdaysAns(payload,action){
    const nowDate = new Date()
    const yesterday=nowDate.setDate(nowDate.getDate() - 1);
    const yesterDaysDate = dateConverter(new Date(yesterday))
    const metadata = JSON.parse(payload.view.private_metadata)
    let blocks = []
    const quetions = metadata.quetions
   
    
    console.log(yesterDaysDate.slice(0,10))
      if(action.selected_options.length>0){ //user checked the checkbox
       const standupAns=await StandupAns.findOne({standupName:metadata.name,allAns: {$elemMatch: {userId:payload.user.id}}})
       
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
      else{ //user unchecked checkbox
        console.log("action.selected_options from else",action.selected_options)

        await callAPIMethodPost("views.update","",block.open_standup_dialog({...metadata,view_id:payload.view.id,update:"false"}))
      }
}

module.exports={
    showYesterdaysAns
}