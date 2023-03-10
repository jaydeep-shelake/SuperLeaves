require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const moment = require("moment");
const Leave = require("./models/leave");
const request = require("request");
const socket_io = require("socket.io");
const signature = require("./verifySignature");
const http = require("http");
const block = require("./payload");
const api = require("./api");
const { WebClient } = require("@slack/web-api");

const User = require("./models/user");
const Team = require("./models/team");
const leavesRouter = require("./routes/leavesRoute");
const userRouter = require("./routes/userRouter");
const teamRouter = require("./routes/teamRouter");
const holidayRouter = require("./routes/holidayRouter");
const Standup = require("./models/standup");
const standupRouter = require("./routes/standupRouter");
const StandupAns = require("./models/standupAns");
const { convertISTtoServerTime, dateConverter } = require("./converter");
const {
  showYesterdaysAns,
  skipStandup,
  skipDueToLeave,
   editChanel,
   submitEditedChannel,
   editUsers,
   updateUsers
} = require("./controllers/standUpModal");
const LeaveType = require("./models/leaveType");
const { getDaysDiff, substractStandupTime } = require("./helpers/helper");
const {
  scheduleCron,
  dailSatndupUpdate,
  mealNofication,
  scheduleUpdateTheStatus,
} = require("./helpers/schedule");
const Holiday = require("./models/holiday");
const { migrate ,addTeamLeads} = require("./migration");
const web = new WebClient(process.env.SLACK_TOKEN);
const app = express();
const server = http.createServer(app);
const io = socket_io(server, {
  cors: {
    origins: ["http://localhost:8080"],
  },
});
const PORT = process.env.PORT || 5000;

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/leaves", leavesRouter);
app.use("/api/users", userRouter);
app.use("/api/team", teamRouter);
app.use("/api/holiday", holidayRouter);
app.use("/api/standup", standupRouter);

// mongodb atlas connection

mongoose.connect(process.env.MONGO_URI, (err) => {
  if (err) throw err;

  console.log("connected...");
  // try{
  //   // migrate()
  //   // addTeamLeads()
  //   // console.log('mingration done')
  // }
  // catch(e){
  // console.log("error while migrating",e)
  // }
  scheduleCron(); //leaves job
  dailSatndupUpdate(); // standup bot job
});

//toISOString()

//authentication of user which gives back the code and from code we can access the access token

app.post("/auth/callback", async (req, res) => {
  // TODO: Add auth controller here
  try {
    var data = {
      form: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.body.code,
      },
    };
    request.post(
      "https://slack.com/api/oauth.v2.access",
      data,
      async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          // Save an auth token (and store the team_id / token)
          console.log(JSON.parse(body));
          const accessToken = JSON.parse(body).authed_user.access_token;
          console.log(accessToken);

          const identity = await web.users.identity({
            token: accessToken,
          });
          console.log("identity", identity);
          const user = await User.findOne({ userId: identity.user.id });
          if (user) {
            //update existing user
            const updatedUser = await User.findOneAndUpdate(
              { userId: identity.user.id },
              {
                // workspace id
                userToken: accessToken,
                teamId: identity.team.id,
                //user profile picture
              },
              { new: true }
            );
            res
              .status(200)
              .send({ identity, token: accessToken, user: updatedUser });
          } else {
            //user dose not exists add to db
            const newUser = new User({
              userId: identity.user.id,
              name: identity.user.name,
              teamId: identity.team.id,
              userToken: accessToken,
              avatar: identity.user.image_192,
            });
            await newUser.save();
            res
              .status(200)
              .send({ identity, token: accessToken, user: newUser });
          }
        }
      }
    );
  } catch (eek) {
    console.log(eek);
    res.status(500).send({ err: ekk });
  }
});

//event

app.post("/events", (req, res) => {
  switch (req.body.type) {
    case "url_verification": {
      // verify Events API endpoint by returning challenge if present
      return res.send({ challenge: req.body.challenge });
    }

    case "event_callback": {
      handleEvent(req.body.event, req.body.team_id);
    }
    default: {
      return res.status(404).send();
    }
  }
});

// handle event  when user makes interactivity with app

const handleEvent = async (event, teamId) => {
  // console.log("event",event)

  switch (event.type) {
    case "app_home_opened": {
      if (event.tab === "home") {
        updateHomePage(event, teamId);
      } else if (event.tab === "messages") {
        // console.log(event)
      }
      break;
    }
    case "user_status_changed": {
      // whenever  user is on leaves and updates status it should automatically update back to on leaves
      const userId = event.user.id;
      const currentDate = new Date().toISOString();

      Leave.findOne({
        dateFrom: { $lte: currentDate },
        dateTo: { $gte: currentDate },
        userId,
      }).then((leave) => {
        const status_expire_time = event.user.profile.status_expiration;
        if (leave !== null) {
          scheduleUpdateTheStatus(
            status_expire_time,
            userId,
            leave.teamId,
            leave.dateTo,
            leave.type
          );
        }
      });
    }
  }
};

//interaction event

app.post("/interactions", async (req, res) => {
  // if (!signature.isVerified(req)) return res.status(400).send();
  const today = new Date();
  const payload = JSON.parse(req.body.payload);
  // console.log("/interaction payload",payload)
  const teamId = payload.team.id;
  if (payload.type === "block_actions") {
    let action = payload.actions[0];
    switch (action.action_id) {
      case "make_leave": // action to create leave from home tab of app
        const date = new Date().toISOString().split("T")[0]; //setting up local date
        User.findOne({ userId: payload.user.id }).then((user) => {
          // console.log("user",user)
          const userTeam = user.team;
          Team.findOne({name: userTeam }).then(async (listOfMembers) => {
            // console.log("list of members",listOfMembers)
            let leaveTypeBlock = [];
            let membersBlock = [];
            let approversBlock = [];
            const leaves_types = await LeaveType.find({});
            if (listOfMembers) {
              const members = listOfMembers.members.filter(
                (mem) => mem.userId !== payload.user.id
              );
              const approvers = listOfMembers.approvers;
              // console.log("list of members",members)

              leaves_types.forEach((item) => {
                leaveTypeBlock.push({
                  text: {
                    type: "plain_text",
                    text: item.type,
                  },
                  value: item.type,
                });
              });

              members.forEach((item) => {
                membersBlock.push({
                  text: {
                    type: "plain_text",
                    text: item.name,
                  },
                  value: item.userId,
                });
              });

              approvers.forEach((item) => {
                approversBlock.push({
                  text: {
                    type: "plain_text",
                    text: item.name,
                  },
                  value: item.userId,
                });
              });

              await api.callAPIMethodPost("views.open", teamId, {
                trigger_id: payload.trigger_id,
                view: block.request_leave({
                  date,
                  leaveTypeBlock,
                  membersBlock,
                  approversBlock,
                  approvers
                }),
              });
            } else {
              await api.callAPIMethodPost("views.open", teamId, {
                trigger_id: payload.trigger_id,
                view: block.request_leave_with_users({ date, leaveTypeBlock }),
              });
            }
          });
        });

        break;
      case "view_analytics":
        const leaveData = JSON.parse(payload.view.private_metadata);
        let analyticsBlock = [];
        leaveData.leavesData.forEach((item) => {
          analyticsBlock.push({
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `\n> ${item.type}`,
              },
              {
                type: "mrkdwn",
                text: `\`${item.count} days \``,
              },
            ],
          });
          analyticsBlock.push({
            type: "divider",
          });
        });

        await api.callAPIMethodPost("views.open", teamId, {
          trigger_id: payload.trigger_id,
          view: block.viewAnalytics({ analyticsBlock }),
        });

        break;
      case "approve":
        const metadata = JSON.parse(action.value).metadata;
        console.log("metadata", metadata);

        Leave.findOneAndUpdate(
          { _id: metadata.leaveId },
          { approved: true },
          { new: true }
        ).then(async (result) => {
          // update the chat of aprrove and reject button when the approver clicks any button
          const dateTo = new Date(result.dateTo);
          const dateFrom = new Date(result.dateFrom);
          const diffDays =
            getDaysDiff(dateTo, dateFrom) + 1 - result.holidayCount; // differnce is less one day , hence add the one and substract the holiday count

          // substract the leave count from user profile with type match
          await User.updateOne(
            { userId: metadata.requester, "leaveCount.type": metadata.type },
            { $inc: { "leaveCount.$.count": -diffDays } }
          );

          await Leave.findOneAndUpdate(
            { _id: metadata.leaveId },
            { approversDesc: payload.state.values.desc.value },
            { new: true }
          );
          await api.callAPIMethodPost(
            "chat.update",
            " ",
            block.approved_message_block({
              ...metadata,
              msgTs: payload.message.ts,
              msg: "Approved",
              approverDesc: payload.state.values.desc.desc.value,
            })
          );

          const userRes = await api.callAPIMethodPost(
            "conversations.open",
            teamId,
            {
              users: metadata.requester,
            }
          );

          await api.callAPIMethodPost(
            "chat.postMessage",
            teamId,
            block.rejected_approved({
              channel: userRes.channel.id,
              msg: "Approved 	:white_check_mark:",
              leave: metadata,
              approverDesc: payload.state.values.desc.desc.value,
            })
          );

          if (metadata.substitute) {
            const resSubstitute = await api.callAPIMethodPost(
              "conversations.open",
              payload.team.id,
              {
                users: metadata.substitute,
              }
            );
            const newSubData = {
              ...metadata,
              channel: resSubstitute.channel.id,
              requester: payload.user.id,
              leaveId: result._id,
              team: metadata.team,
            };
            // //send direct message to substitute
            await api.callAPIMethodPost(
              "chat.postMessage",
              payload.team.id,
              block.substitute({ metadata: newSubData })
            );
          }
        });
        break;

      case "reject":
        console.log("payload from opprove block", payload);
        const rejectMetadata = JSON.parse(action.value).metadata;
        console.log("metadata", rejectMetadata);
        await Leave.findOneAndUpdate(
          { _id: rejectMetadata.leaveId },
          { approversDesc: payload.state.values.desc.value },
          { new: true }
        );

        await api.callAPIMethodPost(
          "chat.update",
          teamId,
          block.approved_message_block({
            ...rejectMetadata,
            msgTs: payload.message.ts,
            msg: "Rejected",
            approverDesc: payload.state.values.desc.desc.value,
          })
        );

        const reUserRes = await api.callAPIMethodPost(
          "conversations.open",
          teamId,
          {
            users: rejectMetadata.requester,
          }
        );

        await api.callAPIMethodPost(
          "chat.postMessage",
          teamId,
          block.rejected_approved({
            channel: reUserRes.channel.id,
            msg: `Rejected :no_entry_sign: contact <@${rejectMetadata.approver}> for the reason`,
            leave: rejectMetadata,
            approverDesc: payload.state.values.desc.desc.value,
          })
        );
        break;

      case "make_standup":
        const userRes = await api.callAPIMethodPost(
          "conversations.open",
          teamId,
          {
            users: payload.user.id,
          }
        );
        await api.callAPIMethodPost(
          "chat.postMessage",
          payload.team.id,
          block.add_to_channel({
            channel: userRes.channel.id,
            userId: payload.user.id,
          })
        );
        break;
      case "channel_select":
        const userId = payload.user.id;

        const selectedChannel = payload.actions[0].selected_conversation;
        console.log(selectedChannel);
        const channelRes = await api.getChannel(selectedChannel);
        
        await api.callAPIMethodPost("views.open", teamId, {
          trigger_id: payload.trigger_id,
          view: block.standupModal({
            userId,
            selectedChannel,
            name: channelRes.channel.name,
            msgTs: payload.message.ts,
          }),
        });
        break;
      case "open_standup_dailog":
        const todaysDate = dateConverter(today);
        const dialogmetadata = JSON.parse(action.value);
        const standupData = await Standup.findOne({
          name: dialogmetadata.name,
        });
        const standupAns = await StandupAns.findOne({
          standupName: dialogmetadata.name,
          date: todaysDate.slice(0, 10),
        });
        if (standupAns !== null) {
          const userAns = standupAns.allAns.find(
            (item) => item.userId === payload.user.id
          );
          console.log("user ans", userAns);
          if (userAns) {
            if (userAns.ans.length > 0) {
              await api.callAPIMethodPost("views.open", teamId, {
                trigger_id: payload.trigger_id,
                view: block.open_standup_dialog_with_value({
                  ...dialogmetadata,
                  msgTs: payload.message.ts,
                  standupId: standupData._id,
                  creatorId: standupData.creatorId,
                  quetions: standupData.quetions,
                  standUpTime: standupData.standUpTime,
                  userAns,
                }),
              });
            } else {
              await api.callAPIMethodPost("views.open", teamId, {
                trigger_id: payload.trigger_id,
                view: block.open_standup_dialog({
                  ...dialogmetadata,
                  msgTs: payload.message.ts,
                  standupId: standupData._id,
                  creatorId: standupData.creatorId,
                  quetions: standupData.quetions,
                  standUpTime: standupData.standUpTime,
                }),
              });
            }
          } else {
            await api.callAPIMethodPost("views.open", teamId, {
              trigger_id: payload.trigger_id,
              view: block.open_standup_dialog({
                ...dialogmetadata,
                msgTs: payload.message.ts,
                standupId: standupData._id,
                creatorId: standupData.creatorId,
                quetions: standupData.quetions,
                standUpTime: standupData.standUpTime,
              }),
            });
          }
        } else {
          await api.callAPIMethodPost("views.open", teamId, {
            trigger_id: payload.trigger_id,
            view: block.open_standup_dialog({
              ...dialogmetadata,
              msgTs: payload.message.ts,
              standupId: standupData._id,
              creatorId: standupData.creatorId,
              quetions: standupData.quetions,
              standUpTime: standupData.standUpTime,
            }),
          });
        }

        break;

      case "show_yesterday_ans":
        showYesterdaysAns(payload, action);
        break;
      case "skip_standup_dailog":
        skipStandup(payload);
        break;
      case "on_leave_standup":
        skipDueToLeave(payload);
        break;
      case "edit_channel":
        editChanel(payload,action)
        break;
      case "edit_users":
        editUsers(payload,action)
        break;
    }
  } else if (payload.type === "view_submission") {
    return handleViewSubmission(payload, res, teamId);
  }
});

const handleViewSubmission = async (payload, res, teamId) => {
  console.log("Top payload", payload);
  //action when user click on next button when modal is open
  switch (payload.view.callback_id) {
    case "request_leave":
      let approver
      const values = payload.view.state.values;
      const aprover_metadata = JSON.parse(payload.view.private_metadata)
      const type = values.leave_type.leave_type.selected_option.value;
      const sub = values.substitute.substitute.selected_option?.value ? values.substitute.substitute.selected_option.value:""
      if(aprover_metadata){
       approver = aprover_metadata.userId
      }
      else{
      approver = values.approver.approver.selected_option.value;
      }
      let today = new Date();
      const dateFrom = new Date(values.date_from.date_from.selected_date);
      const dateTo = new Date(values.date_to.date_to.selected_date);
      const diffDays = getDaysDiff(dateTo, dateFrom) + 1;
      const showWarning = diffDays <= 15;
      const currentDate = dateConverter(new Date());

      //checking if user alredy exits or not
      const existingUser = await User.findOne({ userId: payload.user.id });
      const leaveCount = existingUser.leaveCount.find(
        (itm) => itm.type === type
      ); // users leave

      if (leaveCount.count - diffDays < 0) {
        // block user has finised leaves
        return res.send(
          block.exeed_leave_warning({
            msg: `SORRY! , YOU CAN'T APPLY FOR ${type.toUpperCase()} LEAVE , YOU HAVE EXEEDED YOUR LEAVE`,
          })
        );
      }

      // block user if already on leave

      const leaveRange = await Leave.findOne({
        $and: [
          {
            userId: payload.user.id,
            dateTo: { $lte: dateTo.toISOString() },
            dateFrom: { $gte: dateFrom.toISOString() },
          },
        ],
      });

      if (leaveRange) {
        return res.send(
          block.exeed_leave_warning({
            msg: `SORRY! , YOU CAN'T APPLY FOR ${type.toUpperCase()} LEAVE , YOU ARE ALREADY ON LEAVE , PLEASE CONTACT ADMINISTRATOR`,
          })
        );
      }
      if (
        currentDate > dateFrom.toISOString() &&
        currentDate > dateTo.toISOString()
      ) {
        return res.send(
          block.exeed_leave_warning({
            msg: `SORRY! YOU CAN'T APPLY, PLEASE CHOOSE THE DATES IN FUTURE`,
          })
        );
      }

      const team = await Team.findOne({ "members.userId": payload.user.id });
      //find  holiday count between given date
      const holidayCount = await Holiday.countDocuments({
        date: {
          $gte: dateFrom.toISOString(),
          $lte: dateTo.toISOString(),
        },
      });
      let subInfo
      const userInfo = await api.getUserInfo(payload.user.id)
      const approverInfo = await api.getUserInfo(approver)
        if(sub.length>=1){
        subInfo = await api.getUserInfo(sub)
        console.log('subinfo',subInfo)
        }
        
    
      let leave = {
        dateFrom: dateFrom,
        dateTo: dateTo,
        type,
        approver: approver,
        substitute: sub || null,
        substituteName:subInfo?.user?.real_name ,
        substituteAvatar:subInfo?.user?.profile?.image_192 ,
        user: payload.user.id,
        username:userInfo.user.real_name,
        userAvatar:userInfo.user.profile.image_192,
        approverAvatar:approverInfo.user.profile.image_192,
        approverName:approverInfo.user.real_name,
        desc: values?.desc?.desc?.value ===null?' ':values?.desc?.desc?.value ,
        showWarning,
        diffDays,
        holidayCount,
        team: team ? team.name : "",
      };
      if (existingUser) {
        if (showWarning) {
          return res.send(block.confirm_leave_warning({ leave }));
        } else {
          return res.send(block.confirm_leave({ leave }));
        }
      } else {
        const newUser = new User({
          userId: payload.user.id,
        });
        await newUser
          .save()
          .then(() => console.log("user saved"))
          .catch((e) => console.log("error at saving user", e));
        if (showWarning) {
          return res.send(block.confirm_leave_warning({ leave }));
        } else {
          return res.send(block.confirm_leave({ leave }));
        }
      }
    //respond with a stacked modal to the user to confirm selection

    case "confirm_leave":
      // console.log("confirm Leaves", payload.view.private_metadata)

      console.log("payload confirm Leaves", payload);
      const metadata = JSON.parse(payload.view.private_metadata);
      console.log("metadata from confirm", metadata);

      const newLeave = new Leave({
        teamId: payload.team.id,
        dateFrom: metadata.dateFrom,
        dateTo: metadata.dateTo,
        type: metadata.type, // leave type (vaction, scik , eraned leaves)
        desc: metadata.desc,
        userId: metadata.user,
        approverId: metadata.approver,
        name: metadata.username,
        substituteId: metadata.substitute,
        team: metadata.team,
        holidayCount: metadata.holidayCount,
        substituteAvatar:metadata.substituteAvatar,
        substituteName:metadata.substituteName,
        userAvatar:metadata.userAvatar,
        approverAvatar:metadata.approverAvatar,
        approverName:metadata.approverName
      });
      await newLeave.save(async (err, result) => {
        console.log(result._id);
        // send direct message to approver
        const resChannel = await api.callAPIMethodPost(
          "conversations.open",
          payload.team.id,
          {
            users: metadata.approver,
          }
        );

        const newData = {
          ...metadata,
          channel: resChannel.channel.id,
          requester: payload.user.id,
          leaveId: result._id,
          team: metadata.team,
        };
        console.log("newData", newData);

        await api
          .callAPIMethodPost(
            "chat.postMessage",
            payload.team.id,
            block.approve({ metadata: newData })
          )
          .then(async (result) => {
            await Leave.findOneAndUpdate(
              { userId: payload.user.id },
              { messageTs: result.message.ts },
              { new: true }
            );
          });
      });

      // show the done modal after conforming the leave
      return res.send(block.finish_leave());
    case "request_standup":
      const standupmetadata = JSON.parse(payload.view.private_metadata); // preious value
      const standupUsers =
        payload.view.state.values.standup_users.standup_user_id.selected_users; // array of users
      const selectedWeek =
        payload.view.state.values.week_type.days_in_week.selected_options.map(
          (item) => {
            return {
              text: item.text.text,
              value: item.value,
            };
          }
        );
      const selectedTime =
        payload.view.state.values.standup_time.daily_time.selected_option.value;

      let users = [];
      let promises = [];
      for (i = 0; i < standupUsers.length; i++) {
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

      Promise.all(promises).then(async () => {
        const firstAlert = substractStandupTime(60, selectedTime);
        const secondAlert = substractStandupTime(15, selectedTime);
        const newStandUp = new Standup({
          name: standupmetadata.name,
          users,
          channelId: standupmetadata.selectedChannel,
          weeks: selectedWeek,
          standUpTime: selectedTime,
          creatorId: payload.user.id,
          quetions: [
            { quetion: "What did you complete yesterday?" },
            { quetion: "What do you commit to today" },
            { quetion: " When do you think you'll be done with that" },
            { quetion: "Any impediments in your way" },
          ],
          firstAlert,
          secondAlert,
        });
        // await api.joinChannel(payload.team.id, standupmetadata.selectedChannel);

        await newStandUp.save().then((result)=>{
          api.callAPIMethodPost("chat.postMessage","",block.post_standup_message({
             name: standupmetadata.name,
          users,
          channelId: standupmetadata.selectedChannel,
          weeks: selectedWeek,
          standUpTime: selectedTime,
          creatorId: payload.user.id,
          standupId:result._id,
          quetions: [
            { quetion: "What did you complete yesterday?" },
            { quetion: "What do you commit to today" },
            { quetion: " When do you think you'll be done with that" },
            { quetion: "Any impediments in your way" },
          ],
          url: `http://localhost:8080/standup/${result._id}`,
          firstAlert,
          secondAlert,
          })).then(async (msg)=>{
           await  Standup.updateOne({_id:result._id},{$set:{msgTs:msg.message.ts}})
          })
          
        })
      
        
        return res.send(block.finish_standup());
      });
      break;

    case "post_answers_standup":
      const newDate = new Date();
      const offset = 330; // IST offset is 5 hours and 30 minutes ahead of UTC
      const ISTTime = new Date(newDate.getTime() + offset * 60 * 1000);
      const date = ISTTime.toISOString();
      const ansmetadata = JSON.parse(payload.view.private_metadata);
      const standup = await Standup.findOne({
        name: ansmetadata.name,
        date: date.slice(0, 10),
      });
      const quetions = standup.quetions;
      const standupChannelId = standup.channelId;

      const standupTime = convertISTtoServerTime(standup.standUpTime);
      const user = payload.user.id;
      const allAnsValue = payload.view.state.values;
      const arrayOfAns = Object.values(allAnsValue); // converted objects to array

      const arrayOfAnsOnly = arrayOfAns.map(
        (obj) => Object.values(obj)[0].value
      );

      const existingStandup = await StandupAns.findOne({
        standupName: ansmetadata.name,
        date: date.slice(0, 10),
      });
      if (existingStandup) {
        const exitsingUserAns = existingStandup.allAns.find(
          (item) => item.userId == payload.user.id
        );
        if (exitsingUserAns) {
          await StandupAns.updateOne(
            { standupName: ansmetadata.name, date: date.slice(0, 10) },
            {
              $pull: {
                allAns: { userId: user },
              },
            }
          );
          await StandupAns.updateOne(
            { standupName: ansmetadata.name, date: date.slice(0, 10) },
            {
              $addToSet: {
                allAns: {
                  userId: user,
                  ans: ansmetadata.quetions.map((item, i) => {
                    return {
                      questionId: item._id,
                      question: item.quetion,
                      ans: arrayOfAnsOnly[i],
                    };
                  }),
                },
              },
            }
          );

          const currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          });

          if (standupTime < currentTime) {
            const result = await StandupAns.findOne({
              standupName: ansmetadata.name,
              date: date.slice(0, 10),
            });
            const userAns = result.allAns.filter((itm) => itm.userId === user);
            await web.chat.postMessage(
              block.daily_standup_ans_single({
                channelId: standupChannelId,
                quetions: quetions,
                userAns,
                user,
              })
            );
          }
        } else {
          await StandupAns.updateOne(
            { standupName: ansmetadata.name, date: date.slice(0, 10) },
            {
              $addToSet: {
                allAns: {
                  userId: user,
                  ans: ansmetadata.quetions.map((item, i) => {
                    return {
                      questionId: item._id,
                      question: item.quetion,
                      ans: arrayOfAnsOnly[i],
                    };
                  }),
                },
              },
            }
          );

          const currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          });
          if (standupTime < currentTime) {
            const result = await StandupAns.findOne({
              standupName: ansmetadata.name,
              date: date.slice(0, 10),
            });
            const userAns = result.allAns.filter((itm) => itm.userId === user);
            await web.chat.postMessage(
              block.daily_standup_ans_single({
                channelId: standupChannelId,
                quetions: quetions,
                userAns,
                user,
              })
            );
          }
        }
      } else {
        const today = new Date();
        const offset = 330; // IST offset is 5 hours and 30 minutes ahead of UTC
        const ISTTime = new Date(today.getTime() + offset * 60 * 1000);
        const date = ISTTime.toISOString();
        const newStandupAns = new StandupAns({
          standupId: ansmetadata.standupId,
          creatorId: ansmetadata.creatorId,
          channelId: ansmetadata.selectedChannel,
          standupName: ansmetadata.name,

          date: date.slice(0, 10),
          allAns: [
            {
              userId: user,
              ans: ansmetadata.quetions.map((item, i) => {
                return {
                  questionId: item._id,
                  question: item.quetion,
                  ans: arrayOfAnsOnly[i],
                };
              }),
            },
          ],
        });
        const result = await newStandupAns.save();

        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        if (standupTime < currentTime) {
          const userAns = result.allAns.filter((itm) => itm.userId === user);
          await web.chat.postMessage(
            block.daily_standup_ans_single({
              channelId: standupChannelId,
              quetions: quetions,
              userAns,
              user,
            })
          );
          return;
        }
      }
      return res.send(block.finish_standup());
      
    case"open_edit_channel":
      submitEditedChannel(payload,res)
      break
    case "update_users":
       updateUsers(payload,res)
      break
  }
};

// funnction to update home tab when user clicks on home tab of app

async function updateHomePage(event, teamId) {
  // finding the user's data
  const userdata = await User.findOne({ userId: event.user }); // must be an array
  console.log(userdata);
  if (userdata) {
    await api.callAPIMethodPost("views.publish", teamId, {
      user_id: event.user,
      view: block.welcome_message_testing({
        userId: event.user,
        leavesData: userdata.leaveCount,
      }),
    });
  }
}

io.on("connection", function (socket) {
  console.log("socket connection");
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.slackId;

  const leaveWatcher = Leave.watch();
  leaveWatcher.on("change", (change) => {
    Leave.find({ userId: userId }).then((result) => {
      console.log(result);
      io.emit("changeData", result);
    });

    Leave.find({ approverId: userId, approved: false }).then((result) => {
      io.emit("changeApproverData", result);
    });
  });
});

var socket = io;
module.exports = socket;

server.listen(PORT, async () => {
  console.log("server running", PORT);
  mealNofication();
});
