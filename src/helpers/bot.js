const api = require('../api')
async function getUsersInfo(standupUsers){
      let users = [];
      let promises = [];
      for (let i = 0; i < standupUsers.length; i++) {
        promises.push(
          api.getUserInfo(standupUsers[i]).then((response) => {
            users.push({
              userId: response.user.id,
              name: response.user.real_name,
              email: response.user.profile.email,
              avatar: response.user.profile.image_192,
            });
          })
        );
      }
     return Promise.all(promises).then(async () => {
        return users
     })
}
module.exports={
    getUsersInfo
}