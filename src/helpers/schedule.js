const { convertISTtoServerTime, dateConverter } = require("../converter");
const StandupAns = require("../models/standupAns");
const block = require("../payload");
const { WebClient } = require("@slack/web-api");
const Standup = require("../models/standup");
const Leave = require("../models/leave");
const api = require("../api");
let schedule = require("node-schedule");
const moment = require("moment");
const { fetchAllOrders } = require("./firebase");
const Holiday = require("../models/holiday");
const web = new WebClient(process.env.SLACK_TOKEN);

async function multipleAlerts(doc, alert) {
  console.log("second alert", alert);
  const istString = convertISTtoServerTime(alert);
  const ISThour = parseInt(istString.split(":")[0]); // post one hour before
  const ISTmin = istString.split(":")[1];
  const withoutAMmin = ISTmin.slice(0, -2);
  const date = dateConverter(new Date());
  schedule.scheduleJob(`0 ${withoutAMmin} ${ISThour} * * *`, async function () {
    const standupAns = await StandupAns.findOne({
      $and: [{ date: date.slice(0, 10) }, { standupName: doc.name }],
    });
    if (standupAns) {
      const notAnsUsers = doc.users.filter(
        (item) => !standupAns.allAns.some((obj2) => obj2.userId === item.userId)
      );

      notAnsUsers.forEach(async (item) => {
        try {
          const standupUserRes = await web.conversations.open({
            users: item.userId,
          });
          await web.chat.postMessage({
            channel: standupUserRes.channel.id,
            text: `<@${item.userId}>  heads up! your team standup will be reported in 15 minutes. What did you complete yesterday?`,
          });
        } catch (error) {
          console.log(`Error sending message to ${item}: ${error}`);
        }
      });
    } else {
      doc.users.forEach(async (item) => {
        try {
          const standupUserRes = await web.conversations.open({
            users: item.userId,
          });
          await web.chat.postMessage({
            channel: standupUserRes.channel.id,
            text: `<@${item.userId}>  heads up! your team standup will be reported in 15 minutes. What did you complete yesterday?`,
          });
        } catch (error) {
          console.log(`Error sending message to ${item}: ${error}`);
        }
      });
    }
  });
}

function dailySatndupAnsPost(doc) {
  console.log("came in posting mesage");
  const istSTringPost = convertISTtoServerTime(doc.standUpTime);
  const hour = istSTringPost.split(":")[0]; // post one hour before
  const min = istSTringPost.split(":")[1]; // 30 12 * * *
  const minWithoutAM = min.slice(0, -2);

  schedule.scheduleJob(`0 ${minWithoutAM} ${hour} * * 1-5`, function () {
    const today = new Date();
    const offset = 330; // IST offset is 5 hours and 30 minutes ahead of UTC
    const ISTTime = new Date(today.getTime() + offset * 60 * 1000);
    const date = ISTTime.toISOString().slice(0, 10);

    StandupAns.findOne({
      $and: [{ date: date }, { standupName: doc.name }],
    }).then(async (result) => {
      const users = doc.users; // users in standup
      if (result !== null) {
        const ansUsers = result.allAns; //users who had ans the standup
        //TODO: Make a separte function for filtering the user
        const notAnsUsers = users.filter(
          (item) => !ansUsers.some((obj2) => obj2.userId === item.userId)
        );
        const skipedAnsUsers = ansUsers.filter((item) => item.skip);
        const leaveAnsUsers = ansUsers.filter((item) => item.leave);

        try {
          if (doc.messageViewType === "questions") {
            let ansBlocks = [];

            doc.quetions.forEach((item, i) => {
              ansBlocks.push({
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${item.quetion}*\n${result.allAns.map(
                    (itm) =>
                      itm.ans.length > 0 &&
                      `<@${itm.userId}>\n${itm.ans[i]?.ans}\n`
                  )}`,
                },
              });
              ansBlocks.push({
                type: "divider",
              });
            });
            await web.chat.postMessage(
              block.daily_standup_ans({
                channelId: doc.channelId,
                quetions: doc.quetions,
                result,
                ansBlocks,
                notAnsUsers,
                skipedAnsUsers,
                leaveAnsUsers,
              })
            );
          } else {
            // group by user
            let ansBlocks = [];
            result.allAns.forEach((item) => {
              ansBlocks.push({
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `<@${item.userId}\n ${item.ans.map(
                    (itm) => `*${itm.question}*\n${itm.ans}`
                  )}`,
                },
              });
              ansBlocks.push({
                type: "divider",
              });
            });

            await web.chat.postMessage(
              block.daily_satndup_ans_group_by_users({
                channelId: doc.channelId,
                quetions: doc.quetions,
                result,
                ansBlocks,
                notAnsUsers,
                skipedAnsUsers,
                leaveAnsUsers,
              })
            );
          }
        } catch (error) {
          console.log(`Error sending message  ${error}`);
        }
      }
    });
  });
  //
}

function dailSatndupUpdate() {
  console.log("entered in job");
  let allStandUps = [];

  // collecting documents daily 10 AM - 30 4 * * 1-5 every monday to tuesday
  schedule.scheduleJob("0 30 4 * * 1-5", function () {
    Standup.find({}).then((result) => {
      allStandUps = result;
      console.log("allStandsups", allStandUps);
      if (result) {
        allStandUps.forEach((doc) => {
          console.log("standup time", doc.standUpTime);
          const istString = convertISTtoServerTime(`${doc.firstAlert}`);

          const ISThour = parseInt(istString.split(":")[0]); // post first alert
          console.log("hour", ISThour);
          const ISTmin = istString.split(":")[1];
          const minWithoutAM = ISTmin.slice(0, -2);
          // 30 12 * * *
          // this will be hour before on specifc standup time
          schedule.scheduleJob(
            `${minWithoutAM} ${ISThour} * * 1-5`,
            function () {
              doc.users.forEach(async (item) => {
                try {
                  const standupUserRes = await web.conversations.open({
                    users: item.userId,
                  });
                  await web.chat.postMessage(
                    block.open_standup({
                      userId: item.userId,
                      name: doc.name,
                      channel: standupUserRes.channel.id,
                    })
                  );
                  console.log("send msg to every one");
                } catch (error) {
                  console.log(`Error sending message to ${item}: ${error}`);
                }
              });
            }
          );

          multipleAlerts(doc, doc.secondAlert);
          dailySatndupAnsPost(doc);
        });
      }
    });
  });

  //this will run after one hour
}

const scheduleCron = () => {
  schedule.scheduleJob("0 30 4 * * 1-5", async function () {
    const currentDate = dateConverter(new Date());
    //find the holiday for current
    const holiday = await Holiday.findOne({ date: currentDate });
    console.log("holiday", holiday);
    if (holiday === null) {
      Leave.find({
        dateFrom: { $lte: currentDate },
        dateTo: { $gte: currentDate },
      }).then(async (leaves) => {
        console.log("all leaves", leaves);
        if (leaves.length > 0) {
          leaves.forEach(async (item, i) => {
            const expTime = moment(
              item.dateTo.slice(0, 10),
              "YYYY-MM-DD"
            ).unix();
            if (item.type !== "remote") {
              await api.callAPIMethodPost("users.profile.set", "T38BC9NLD", {
                user: item.userId,
                profile: {
                  status_text: `PTO Till ${new Date(
                    item.dateTo
                  ).toDateString()}`,
                  status_emoji: ":palm_tree:",
                  status_expiration: expTime,
                },
              });
            } else {
              await api.callAPIMethodPost("users.profile.set", "T38BC9NLD", {
                user: item.userId,
                profile: {
                  status_text: `Remote work Till ${new Date(
                    item.dateTo
                  ).toDateString()}`,
                  status_emoji: ":computer:",
                  status_expiration: expTime,
                },
              });
            }
          });

          const leavesWithoutRemote = leaves.filter(
            (item) => item.type !== "remote"
          );
          await api.callAPIMethodPost(
            "chat.postMessage",
            "T38BC9NLD",
            block.dailyNotification({ leaves: leavesWithoutRemote })
          );
        }
      });
    }
  });
};

function mealNofication() {
  // sending message at 11:30 am
  schedule.scheduleJob("0 0 6 * * 4", function () {
    return new Promise(async (resolve, reject) => {
      fetchAllOrders()
        .then((response) => {
          let users = [];
          let promises = [];
          for (let i = 0; i < response.data.length; i++) {
            promises.push(
              api.getUesrInfoByEmail(response.data[i]).then((res) => {
                if (res.ok === true) users.push(res.user.id);
              })
            );
          }

          Promise.all(promises).then(async () => {
            let chatPromise = [];
            let testUsers = [
              "U04CT5EJLCV",
              "U04E9N3TU83",
              "U03DK72GLK1",
              "U0250LD0996",
              "U04CB3AHR3L",
            ];
            for (let i = 0; i < users.length; i++) {
              chatPromise.push(
                api
                  .callAPIMethodPost("conversations.open", "", {
                    users: users[i],
                  })
                  .then(async (userRes) => {
                    await api.callAPIMethodPost(
                      "chat.postMessage",
                      "",
                      block.food_message_notification({
                        channel: userRes.channel.id,
                        userId: users[i],
                      })
                    );
                  })
                  .catch((err) => console.log(err))
              );
            }
            Promise.all(chatPromise).then(() =>
              console.log("all message sent")
            );
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
}

function scheduleUpdateTheStatus(timeToUpdate, userId, teamId, dateTo, type) {
  const unixTimestamp = timeToUpdate;
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

  schedule.scheduleJob(rule, async function () {
    const expTime = moment(dateTo.slice(0, 10), "YYYY-MM-DD").unix();
    if (type !== "remote") {
      await api.callAPIMethodPost("users.profile.set", teamId, {
        user: userId,
        profile: {
          status_text: `PTO Till ${new Date(dateTo).toDateString()}`,
          status_emoji: ":palm_tree:",
          status_expiration: expTime,
        },
      });
    } else {
      await api.callAPIMethodPost("users.profile.set", teamId, {
        user: userId,
        profile: {
          status_text: `Remote work Till ${new Date(dateTo).toDateString()}`,
          status_emoji: ":computer:",
          status_expiration: expTime,
        },
      });
    }
  });
}

module.exports = {
  multipleAlerts,
  dailSatndupUpdate,
  scheduleCron,
  mealNofication,
  scheduleUpdateTheStatus,
};
