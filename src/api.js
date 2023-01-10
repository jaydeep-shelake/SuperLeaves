const axios = require("axios");
const Token = require("./models/token");
const apiUrl = "https://slack.com/api";
const callAPIMethodPost = async (method, teamId, payload) => {
      let token = await Token.findOne({teamId})
      console.log(token)
    let result = await axios.post(`${apiUrl}/${method}`, payload, {
      headers: { Authorization: "Bearer " + token.accessToken }
    });
    console.log("data from api",result.data)
    return result.data;
  };

const saveCredential = async (teamId, accessToken)=>{
   const newToken = new Token({
    teamId,
    accessToken
   }) 
   await newToken.save()
}

module.exports ={
    callAPIMethodPost,
    saveCredential
}

//https://slack.com/oauth/v2/authorize?client_id=110386328693.4590206438709&team=T38BC9NLD&install_redirect=update-to-granular-scopes&scope=bookmarks:read,bookmarks:write,calls:read,calls:write,channels:read,chat:write,dnd:read,files:read,groups:read,im:history,im:read,im:write,mpim:history,mpim:read,mpim:write,pins:write,reactions:read,reactions:write,remote_files:read,remote_files:share,remote_files:write,team:read,users.profile:read,users:read,users:read.email,users:write&user_scope=users.profile:read,users.profile:write