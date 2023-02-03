// file to return intarictive ui
module.exports = {
shortMessage: context=>{
    return {
        channel: context.channel,
        text: context.text
      };
},

//home block kit
welcome_home: context => {
  return {
    type: "home",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:mage: Hello there <@${context.userId}>! It's your SuperBot. I'm here to help you manage your leave so your team knows when you are OFF. To start click on button bellow to create leave.`
        }
      },
      ...context.errBlocks,
      {
        type: "actions",
        elements: [
          {
            action_id: "make_leave",
            type: "button",
            text: {
              type: "plain_text",
              text: "Create Leave"
            },
            style: "primary",
            value: "make_leave"
          }
        ]
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":clock7: Active leave",
          emoji: true
        }
      },
      {
        type: "divider"
      },
      ...context.activeleaves,
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":date: Upcoming leave",
          emoji: true
        }
      },
      {
        type: "divider"
      },
      ...context.upcomingleaves,
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":hourglass_flowing_sand: Pending leave",
          emoji: true
        }
      },
      {
        type: "divider"
      },
      ...context.notApprovedLeaves,
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":outbox_tray: My requests",
          emoji: true
        }
      },
      {
        type: "divider"
      },
      ...context.userLeaves
    ]
  };
},

//welcome message on home tab only for testing

welcome_message_testing: context => {
  return {
   type: "home",
   blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `:wave: Hello there <@${context.userId}> I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave.`
        }
      },
      {
        type: "actions",
        elements: [
          {
            action_id: "make_leave",
            type: "button",
            text: {
              type: "plain_text",
              text: "Create Leave"
            },
            style: "primary",
            value: "make_leave"
          },
          {
            action_id: "view_analytics",
            type: "button",
            text: {
              type: "plain_text",
              text: "View Analytics"
            },
            value: "view_analytics"

          },
          {
            action_id: "make_standup",
            type: "button",
            text: {
              type: "plain_text",
              text: "Create Standup"
            },
            style: "primary",
            value: "make_standup"

          },
        ]
      }
    ],
    private_metadata:JSON.stringify(context)
  };
},

// block kit for creating leav button
welcome_message: context => {
    return {
      channel: context.channel,
      text:
        `:wave: Hello there <@${context.userId}> I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave.`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `:wave: Hello there <@${context.userId}> I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave.`
          }
        },
        {
          type: "actions",
          elements: [
            {
              action_id: "make_leave",
              type: "button",
              text: {
                type: "plain_text",
                text: "Create Leave"
              },
              style: "primary",
              value: "make_leave"
            }
          ]
        }
      ]
    };
  },

// block kit to open the modal for leav
  request_leave: context => {
    return {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Request a leave"
      },
      callback_id: "request_leave",
      blocks: [
        {
          type: "input",
          block_id: "date_from",
          label: {
            type: "plain_text",
            text: "From"
          },
          element: {
            type: "datepicker",
            action_id: "date_from",
            initial_date: context.date,
            placeholder: {
              type: "plain_text",
              text: "Select start date"
            }
          }
        },
        {
          type: "input",
          block_id: "date_to",
          label: {
            type: "plain_text",
            text: "To"
          },
          element: {
            type: "datepicker",
            action_id: "date_to",
            initial_date: context.date,
            placeholder: {
              type: "plain_text",
              text: "Select end date"
            }
          }
        },

        {
          type: "input",
          block_id: "leave_type",
          label: {
            type: "plain_text",
            text: "Leave type"
          },
          element: {
            action_id: "leave_type",
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select an item"
            },
            initial_option: {
              text: {
                type: "plain_text",
                text: "Earned Leaves"
              },
              value: "earned leaves"
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Festive Leaves"
                },
                value: "festive leaves"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Remote Work"
                },
                value: "remote"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Earned Leaves"
                },
                value: "earned leaves"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Sick Leaves"
                },
                value: "sick leaves"
              }
            ]
          }
        },

        //substitute

        {
          block_id: "substitute",
          type: "input",
          label: {
            type: "plain_text",
            text: "Substitute"
          },
          element: {
            action_id: "substitute_id",
            type: "users_select"
          }
        },


        {
          block_id: "approver",
          type: "input",
          label: {
            type: "plain_text",
            text: "Approver"
          },
          element: {
            action_id: "approver_id",
            type: "users_select"
          }
        },
        {
          block_id: "desc",
          type: "input",
          label: {
            type: "plain_text",
            text: "Notes"
          },
          optional: true,
          element: {
            action_id: "desc",
            type: "plain_text_input",
            max_length: 150,
            placeholder: {
              type: "plain_text",
              text:
                "eg. I am on vacation untill Jul 15th. If you have some urgent issue, please, write me email with urgent in subject."
            },
            multiline: true
          }
        }
      ],
      submit: {
        type: "plain_text",
        text: "Next"
      }
    };
  },


  //modal for conforming the leav


  confirm_leave: context => {
    console.log(context)
    return {
      response_action: "push",
      view: {
        callback_id: "confirm_leave",
        type: "modal",
        title: {
          type: "plain_text",
          text: "Confirm leave request"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*From*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateFrom.toDateString()
            }
          },

          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*To*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateTo.toDateString()
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Leave type*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.type
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Notes*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.desc
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*APPROVER*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${context.leave.approver}>`
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*SUBSTITUTE*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${context.leave.substitute}>`
            }
          },
        ],
        close: {
          type: "plain_text",
          text: "Back"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        private_metadata: JSON.stringify(context.leave)
      }
    };
  },


  // confrim leave warning
  confirm_leave_warning: context => {
    console.log(context)
    return {
      response_action: "push",
      view: {
        callback_id: "confirm_leave",
        type: "modal",
        title: {
          type: "plain_text",
          text: "Confirm leave request"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:`*Waring:* `
            }
          },
          
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:`\`You have exeeded by ${context.leave.diffDays}\``
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*From*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateFrom.toDateString()
            }
          },

          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*To*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateTo.toDateString()
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Leave type*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.type
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Notes*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.desc
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*APPROVER*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${context.leave.approver}>`
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*SUBSTITUTE*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${context.leave.substitute}>`
            }
          },
        ],
        close: {
          type: "plain_text",
          text: "Back"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        private_metadata: JSON.stringify(context.leave)
      }
    };
  },

  // block kit to  submit  leave 
  finish_leave: ()=> {
    return {
      response_action: "update",
      view: {
        callback_id: "finish_leave",
        clear_on_close: true,
        type: "modal",
        title: {
          type: "plain_text",
          text: "Success :tada:",
          emoji: true
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Your leave request has been sent for approval."
            }
          }
        ],
        close: {
          type: "plain_text",
          text: "Done"
        }
      }
    };
  },


  // block kit to send aprover a aprove and reject button
  approve: context => {
    return {
      channel: context.metadata.channel,
      text: `<@${context.metadata.requester}> asked for *approval* of following leave request`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${context.metadata.requester}> asked for *approval* of following leave request:`
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:* ${new Date(context.metadata.dateFrom).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*To:* ${new Date(context.metadata.dateTo).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*Leave type:* ${context.metadata.type} :palm_tree:`
            },
            {
              type: "mrkdwn",
              text: `*Notes:* ${context.metadata.desc}`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "actions",
          block_id: "actionblock789",
          elements: [
            {
              action_id: "approve",
              type: "button",
              text: {
                type: "plain_text",
                text: "Approve",
                emoji: true
              },
              style: "primary",
              value: JSON.stringify(context)
            },
            {
              action_id: "reject",
              type: "button",
              text: {
                type: "plain_text",
                text: "Reject",
                emoji: true
              },
              style: "danger",
              value: JSON.stringify(context)
            }
          ]
        }


      ]
    };
  },

  substitute:context=>{
    return{
      channel:context.metadata.channel,
      text:`<@${context.metadata.requester}> \n is on leave from \`${new Date(context.metadata.dateFrom).toDateString()}\` to \`${new Date(context.metadata.dateTo).toDateString()}\`  you are choosen as substitute`
    }
  },

  dailyNotification: context=>{
    return{
     channel:"C04H0C61MTR",
     text:`Today’s upcoming absences:\n ${context.leaves.map((item,i)=>`:palm_tree: <@${item.userId}> \n \`${new Date(item.dateFrom).toDateString()}\` to \`${new Date(item.dateTo).toDateString()}\` \n`)}`
    }
  },

// block kit for aproving and rejecting the leave
  rejected_approved: context => {
    return {
      channel: context.channel,
      text: `Your leave request has been ${context.msg}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Your leave request has been ${context.msg}!`,
            
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:* ${new Date(context.leave.dateFrom).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*To:* ${new Date(context.leave.dateTo).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*Leave type:* ${context.leave.type}`
            },
            {
              type: "mrkdwn",
              text: `*Notes:* ${context.leave.desc}`
            }
          ]
        }
      ]
    };
  },

  viewAnalytics:context=>{
    
    return{
      type: "modal",
      title: {
        type: "plain_text",
        text: "Analytics"
      },
      callback_id: "analytics",
      blocks: [
        
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*Earned Leaves*: \`${context?.earned} days \``
            },
            {
              type: "mrkdwn",
              text: `*Festive*: \`${context?.festive} days \``
            },
            {
              type: "mrkdwn",
              text: `*Sick*: \`${context?.sick} days\``
            },
            {
              type: "mrkdwn",
              text: `*Total*: \`${context?.total} days\``
            },
          ]
        },


      ]
    }
  },


  add_to_channel: context => {
    return{
     channel:context.channel,
     text:`<@${context.userId}> Which channel do you want to organize your standup?`,
     blocks:[
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<@${context.userId}> Which channel do you want to organize your standup?`,
          
        }
      },
      {
        type: "actions",
        block_id: "select",
        elements: [
          {
            type: "conversations_select",
            placeholder: {
              type: "plain_text",
              text: "Select channel",
              emoji: true
            },
            filter: {
              include: ["public","private"]
            },
            action_id: "channel_select"
          },
         
        ]
      },
     
    ],

    } 
  },
  standupModal: context => {
   return{
    type: "modal",
      title: {
        type: "plain_text",
        text: `Create channel ${context.name}`,
      },
      callback_id: "request_standup",
      blocks: [
        {
          block_id: "standup_users",
          type: "input",
          label: {
            type: "plain_text",
            text: "Who participates (no bot/app user please, at least 2 users)?"
          },
          element: {
            action_id: "standup_user_id",
            type: "multi_users_select",
            initial_users:[context.userId]
          }
        },

        {
          type: "input",
          block_id: "week_type",
          label: {
            type: "plain_text",
            text: "Which days in a week?"
          },
          element: {
            action_id: "days_in_week",
            type: "multi_static_select",
            placeholder: {
              type: "plain_text",
              text: "Select days"
            },
            initial_options:[
              {
              text: {
                type: "plain_text",
                text: "Mon"
              },
              value: "monday"
            },
            {
              text: {
                type: "plain_text",
                text: "Tue"
              },
              value: "tuesday"
            },
            {
              text: {
                type: "plain_text",
                text: "Wed"
              },
              value: "wednesday"
            },
            {
              text: {
                type: "plain_text",
                text: "Thu"
              },
              value: "thursday"
            },
            {
              text: {
                type: "plain_text",
                text: "Fri"
              },
              value: "friday"
            }
          ],
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Mon"
                },
                value: "monday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Tue"
                },
                value: "tuesday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Wed"
                },
                value: "wednesday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Thu"
                },
                value: "thursday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Fri"
                },
                value: "friday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Sat"
                },
                value: "saturday"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Sun"
                },
                value: "sunday"
              },
            ]
          }
        },
        {
          type: "input",
          block_id: "standup_time",
          label: {
            type: "plain_text",
            text: "at what time?"
          },
          element: {
            action_id: "daily_time",
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select an item"
            },
            initial_option: {
              text: {
                type: "plain_text",
                text: "10:30"
              },
              value: "10:30"
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "10:30"
                },
                value: "10:30"
              },
              {
                text: {
                  type: "plain_text",
                  text: "11:00"
                },
                value: "11:00"
              },
              {
                text: {
                  type: "plain_text",
                  text: "11:30"
                },
                value: "11:30"
              },
              {
                text: {
                  type: "plain_text",
                  text: "12:00"
                },
                value: "12:00"
              }
            ]
          }
        },
      ],
      close: {
        type: "plain_text",
        text: "Back"
      },
      submit: {
        type: "plain_text",
        text: "Next"
      },
      private_metadata: JSON.stringify(context)
   }
  },
  finish_standup:()=>{
    return {
      response_action: "update",
      view: {
        callback_id: "finish_leave",
        clear_on_close: true,
        type: "modal",
        title: {
          type: "plain_text",
          text: "Success :tada:",
          emoji: true
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Stand up has created successfully !"
            }
          }
        ],
        close: {
          type: "plain_text",
          text: "Done"
        }
      }
    };
  },
  post_standup_message:(context)=>{
    return{
      channel:context.channelId,
      text:`*Congratulation, your standup was created and scheduled!* \n The meeting time is \`${context.standUpTime}\` (India Time +05:30). Alice will remind you \`30 minutes\` before the meeting. Once you write your answers to Alice's questions, she reports to the \`${context.name}\` channel at the meeting time \n _Participants_:${context.users.map((item)=>`<@${item.userId}> ,`)}.\n
      _Interview questions_:\n
      ${context.quetions.map((item)=>`${item.quetion}? \n`)}

      `,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Congratulation, your standup was created and scheduled!* \n The meeting time is \`${context.standUpTime}\` (India Time +05:30). Alice will remind you \`30 minutes\` before the meeting. Once you write your answers to Alice's questions, she reports to the \`${context.name}\` channel at the meeting time \n _Participants_:${context.users.map((item)=>`<@${item.userId}> `)}.\n_Interview questions_:\n${context.quetions.map((item)=>`${item.quetion} \n`)}
            `
          }
        },
        {
          type: "divider"
        },
{
          type: "actions",
          block_id: "actionblock789",
          elements: [
            {
              action_id: "edit_channel",
              type: "button",
              text: {
                type: "plain_text",
                text: "Edit Channel",
                emoji: true
              },
              style: "primary",
              value: JSON.stringify(context)
            },
            {
              action_id: "edit_users",
              type: "button",
              text: {
                type: "plain_text",
                text: "Edit Users",
                emoji: true
              },
              style: "primary",
              value: JSON.stringify(context)
            },
            {
              
              type: "button",
              text: {
                type: "plain_text",
                text: "Advance setting",
                emoji: true
              },
              style: "primary",
              value: JSON.stringify(context),
              url: context.url
            }
          ]
        }

      ]
    }
  },
  open_standup:(context)=>{
  return{
    channel:context.channel,
    text:`Hello, it's time to start your today's standup for \`${context.name}\`. Please answer following questions (reply skip to not report today).What did you complete yesterday?`,
    blocks:[
      {
        type: "section",
        text:{
          type:"mrkdwn",
          text:`Hello, it's time to start your today's standup for \`${context.name}\`. Please answer following questions (reply skip to not report today).What did you complete yesterday?`
        },
      },
      {
        type: "divider"
      },
      {
        type: "actions",
        block_id: "actionblock789",
        elements: [
          {
            action_id: "open_standup_dailog",
            type: "button",
            text: {
              type: "plain_text",
              text: "Open dialog",
              emoji: true
            },
            style: "primary",
            value: JSON.stringify(context)
          },
          {
            action_id: "skip_standup_dailog",
            type: "button",
            text: {
              type: "plain_text",
              text: "I skip",
              emoji: true
            },
            style: "primary",
            value: JSON.stringify(context)
          },
        ]
      }
    ]
  }
  },
  open_standup_dialog:(context)=>{
    if(context.update==="true"){
      return{
        view_id:context.view_id,
        view:{
        type: "modal",
        title: {
          type: "plain_text",
          text: `Standup for  ${context.name}`,
        },
        callback_id: "post_answers_standup",
        blocks:[...context.blocks,{
          type: "section",
          text: {
            type: "plain_text",
            text: "Show yesterdays answers"
          },
          accessory:{
            type: "checkboxes",
            action_id: "show_yesterday_ans",
            initial_options:[
              {
                value: "yesterdayAns",
                text: {
                  type: "plain_text",
                  text: "Show yesterday ans"
                }
              },
            ],
            options: [
              {
                value: "yesterdayAns",
                text: {
                  type: "plain_text",
                  text: "Show yesterday ans"
                }
              },
            ]
          }
         
        } ],
        close: {
          type: "plain_text",
          text: "Cancel"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        private_metadata: JSON.stringify(context)
       }
    }
  }
  if(context.update==="false"){
    return{
      view_id:context.view_id,
      view:{
      type: "modal",
      title: {
        type: "plain_text",
        text: `Standup for  ${context.name}`,
      },
      callback_id: "post_answers_standup",
      blocks:[...context.quetions.map((item)=>{
        return {
          block_id: `desc_${item._id}`,
          type: "input",
          label: {
            type: "plain_text",
            text: `${item.quetion} ?`
          },
          optional: false,
          element: {
            action_id: `desc_${item._id}`,
            type: "plain_text_input",
            max_length: 600,
            initial_value:"",
            placeholder: {
              type: "plain_text",
              text:"required"
            },
            multiline: true
          },
          
          
        }
        
      }),{
        type: "section",
        text: {
          type: "plain_text",
          text: "Show yesterdays answers"
        },
        accessory:{
          type: "checkboxes",
          action_id: "show_yesterday_ans",
          
          options: [
            {
              value: "yesterdayAns",
              text: {
                type: "plain_text",
                text: "Show yesterday ans"
              }
            },
          ]
        }
       
      } ],
      close: {
        type: "plain_text",
        text: "Cancel"
      },
      submit: {
        type: "plain_text",
        text: "Submit"
      },
      private_metadata: JSON.stringify(context)
     
  
}
    }
  }
  else{
    return{
      
      type: "modal",
      title: {
        type: "plain_text",
        text: `Standup for  ${context.name}`,
      },
      callback_id: "post_answers_standup",
      blocks:[...context.quetions.map((item)=>{
        return {
          block_id: `desc_${item._id}`,
          type: "input",
          label: {
            type: "plain_text",
            text: `${item.quetion} ?`
          },
          optional: false,
          element: {
            action_id: `desc_${item._id}`,
            type: "plain_text_input",
            max_length: 600,
            initial_value:"",
            placeholder: {
              type: "plain_text",
              text:"required"
            },
            multiline: true
          },
          
          
        }
        
      }),{
        type: "section",
        text: {
          type: "plain_text",
          text: "Show yesterdays answers"
        },
        accessory:{
          type: "checkboxes",
          action_id: "show_yesterday_ans",
          
          options: [
            {
              value: "yesterdayAns",
              text: {
                type: "plain_text",
                text: "Show yesterday ans"
              }
            },
          ]
        }
       
      } ],
      close: {
        type: "plain_text",
        text: "Cancel"
      },
      submit: {
        type: "plain_text",
        text: "Submit"
      },
      private_metadata: JSON.stringify(context)
     
  
}
  }
  },

  

  open_standup_dialog_with_value:(context)=>{
    return{
     type: "modal",
     title: {
       type: "plain_text",
       text: `Standup for  ${context.name}`,
     },
     callback_id: "post_answers_standup",
     blocks:context.quetions.map((item,i)=>{
       return {
         block_id: `desc_${item._id}`,
         type: "input",
         label: {
           type: "plain_text",
           text: `${item.quetion} ?`
         },
         optional: false,
         element: {
           action_id: `desc_${item._id}`,
           type: "plain_text_input",
           max_length: 600,
           initial_value:context.userAns.ans[i].ans,
           placeholder: {
             type: "plain_text",
             text:"required"
           },
           multiline: true
         }
       }
     }),
     close: {
       type: "plain_text",
       text: "Cancel"
     },
     submit: {
       type: "plain_text",
       text: "Submit"
     },
     private_metadata: JSON.stringify(context)
    }
   },
  stantup_desc: context => {
    return 
  },
  daily_standup_ans:(context)=>{
    console.log("context form block kit",context)
    return{
      channel:context.channelId,
      text:"Hey <!here>, today's standup Web Daily Stand Up complete:coffee::coffee::coffee:",
      blocks:[ {
        type: "section",
        text:{
          type:"mrkdwn",
          text:`Hey <!here>, today's standup Web Daily Stand Up complete:coffee::coffee::coffee:`
        },
        
      },
      {
        type: "divider"
      },
      ...context.ansBlocks,
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${context.notAnsUsers.length>0? `I didn't hear from${context.notAnsUsers.map((itm)=>`<@${itm.userId}>`)} ! Keep up your good work, team!` :'! Keep up your good work, team!' }`
          }
        ]
      }
      
    ],
    }
  },
  daily_standup_ans_single:(context)=>{
    console.log("context form block kit",context)
    return{
      channel:context.channelId,
      text:"Hey <!here>, today's standup Web Daily Stand Up complete:coffee::coffee::coffee:",
      blocks:[ {
        type: "section",
        text:{
          type:"mrkdwn",
          text:`Hey <!here>, today's standup Web Daily Stand Up complete:coffee::coffee::coffee:`
        },
        
      },
      {
        type: "divider"
      },
      ...context.ansBlocks,
    ],
    attachments:[
      {
        mrkdwn_in: ["text"],
        footer:`${context.notAnsUsers.length>0? `I didn't hear from${context.notAnsUsers.map((itm)=>`<@${itm.userId}>`)} ! Keep up your good work, team!` :'! Keep up your good work, team!' }`
      }
    ] 
    }
  },
}
