const axios = require("axios");
const Token = require("./models/token");
const User = require("./models/user");
const apiUrl = "https://slack.com/api";
const callAPIMethodPost = async (method, teamId, payload) => {
      
  
      if(method==="users.profile.set"){ 
        const userId=payload.user
        //TODO: find the user token and update the status of user
        const user = await User.findOne({userId:userId})
        console.log("user",user)
        let result = await axios.post(`${apiUrl}/${method}`, payload, {
          headers: { Authorization: "Bearer " + user.userToken } // user token to update user status 
        });
        console.log("data from api",result.data)
        return result.data;
      }
      else{
        let result = await axios.post(`${apiUrl}/${method}`, payload, {
          headers: { Authorization: "Bearer " + process.env.SLACK_TOKEN  } // bot token to post messages 
        });
        console.log("data from api",result.data)
        return result.data;
      }
    
  };

 const getChannel=async(channel)=>{
  const {data} = await axios.get(`https://slack.com/api/conversations.info?channel=${channel}`, {
    headers: { Authorization: "Bearer " + process.env.SLACK_TOKEN  } 
  })
  return data
 }
 const getUserInfo = async(userId)=>{
  const {data} = await axios.get(`https://slack.com/api/users.info?user=${userId}`,{
    headers: { Authorization: "Bearer " + process.env.SLACK_TOKEN  } 
  })
  return data
 }

const saveCredential = async (teamId, accessToken)=>{
   const newToken = new Token({
    teamId,
    accessToken
   }) 
   await newToken.save()
}

const joinChannel = async (teamId, channel) => {
  let {data} = await callAPIMethodPost("conversations.join", teamId, {
    channel: channel
  });
  return data;
};

module.exports ={
    callAPIMethodPost,
    saveCredential,
    getChannel,
    getUserInfo,
    joinChannel
}

//https://slack.com/oauth/v2/authorize?client_id=110386328693.4590206438709&team=T38BC9NLD&install_redirect=update-to-granular-scopes&scope=bookmarks:read,bookmarks:write,calls:read,calls:write,channels:read,chat:write,dnd:read,files:read,groups:read,im:history,im:read,im:write,mpim:history,mpim:read,mpim:write,pins:write,reactions:read,reactions:write,remote_files:read,remote_files:share,remote_files:write,team:read,users.profile:read,users:read,users:read.email,users:write&user_scope=users.profile:read,users.profile:write,identity.basic,identity.email


//https://slack.com/oauth/v2/authorize?client_id=110386328693.4590206438709&user_scope=identity.team,identity.basic,identity.email,identity.avatar&redirect_uri=https://e375-2401-4900-16e5-9687-d18e-503d-94bc-5520.in.ngrok.io/auth


//https://supershare.slack.com/oauth?client_id=110386328693.4590206438709&scope=&user_scope=identity.team%2Cidentity.basic%2Cidentity.email&granular_bot_scope=1&single_channel=0&install_redirect=&tracked=1&team=

//https://e375-2401-4900-16e5-9687-d18e-503d-94bc-5520.in.ngrok.io/auth