
const {convertISTtoServerTime,dateConverter} = require('../converter');
const StandupAns = require("../models/standupAns");
let schedule = require('node-schedule');
async function multipleAlerts(doc,web,alert){
    console.log("second alert",alert)
    const istString = convertISTtoServerTime(alert)
    const ISThour=parseInt(istString.split(":")[0]) // post one hour before
    const ISTmin=istString.split(":")[1];
    const date = dateConverter(new Date())
    schedule.scheduleJob(`${ISTmin} ${ISThour} * * *`, async function(){
        const standupAns = await StandupAns.findOne({$and: [{date:date.slice(0,10)},{standupName:doc.name}]})
        const notAnsUsers =doc.users.filter((item)=> !standupAns.allAns.some(obj2 => obj2.userId === item.userId))
             
        notAnsUsers.forEach(async(item)=>{
          try {
            const standupUserRes = await web.conversations.open({
            users:item.userId
            })
            await web.chat.postMessage({
                channel:standupUserRes.channel.id,
                text:`<@${item.userId}>  heads up! your team standup will be reported in 15 minutes. What did you complete yesterday?`
            })
            
          } catch (error) {
             console.log(`Error sending message to ${item}: ${error}`)
          }
         })
        
        
      }.bind(null))
       
}

module.exports={
    multipleAlerts
}