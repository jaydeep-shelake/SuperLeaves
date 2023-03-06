const e = require('express');
const fs = require('fs');
const XLSX = require('xlsx');
const { getUesrInfoByEmail } = require('./api');
const Team = require('./models/team');
const User = require('./models/user')
async function migrate(){

const workbook = XLSX.readFile('data.xlsx');
const sheet_name = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheet_name];
const email_objects = [];


let current_email = '';
let current_team =''

for (let row = 2; ; row++) {
  
  const email_cell = worksheet['C' + row];
  const team_cell = worksheet['E'+row]
 
  if (!email_cell) break;
  const email = email_cell.v;
  const team = team_cell.v
  
  if (email !== current_email ) {
    current_email = email;
    current_team = team
    var email_data = [];
    
  }

  // Extract the absence_type and allowed values from the current row
  const absence_type_cell = worksheet['G' + row];
  const allowed_cell = worksheet['P' + row];

  const absence_type = absence_type_cell ? absence_type_cell.v : '';
  const allowed = allowed_cell ? allowed_cell.v : '';
  
  // Push the absence_type and allowed values to the email_data array
  email_data.push({
    type: absence_type.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toLowerCase())+'s',
    count: allowed==='∞'?0:allowed
  });
 
  // If the email_data array has 8 elements, push the email object to the email_objects array and reset the email_data array
  if (email_data.length === 7) {
    email_objects.push({
      email: current_email,
      data: email_data,
      team:current_team,
    })
     email_data = [];
  }
}


const teamMap = new Map();
for (const item of email_objects) {
  try {
    const res = await getUesrInfoByEmail(item.email);
    const newUser = new User({
      userId: res.user.id,
      name: res.user.real_name,
      avatar: res.user.profile.image_192,
      email: item.email,
      leaveCount: item.data,
      team: item.team
    });
    await newUser.save();

    const teamName = newUser.team;
    if (!teamMap.has(teamName)) {
      const newTeam = new Team({
        name: teamName,
        members: [{
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          userId: newUser.userId,
        }]
      });
      await newTeam.save();
      teamMap.set(teamName, newTeam);
    } else {
      const existingTeam = teamMap.get(teamName);
      existingTeam.members.push({
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        userId: newUser.userId,
      });
      await existingTeam.save();
    }
  } catch (e) {
    console.log('err while saving', e);
  }
}
}

async function addTeamLeads(){
 const obj={
name:"Yash Agarwal",
email:"yash@quiph.com",
avatar:"https://secure.gravatar.com/avatar/bdc96af4e6604acdf9e24f9df7d9a381.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0001-192.png",
userId:"U036UBWGGJH",
 }
 const teams = await Team.findOne({name:"Team Leads"})
 teams.approvers.forEach(async(memb)=>{
   await Team.findOneAndUpdate({name:"Founder's Office Team"},{$push:{approvers:memb}})
 })
//  await Team.findOneAndUpdate({name:"GTM Team"},{$push:{members:obj}})
}

module.exports={
    migrate,
    addTeamLeads
}

// Convert the result object to JSON format and log it to the console
// console.log(JSON.stringify(result));
