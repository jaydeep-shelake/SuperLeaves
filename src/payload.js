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

          }
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
                text: "Vacation"
              },
              value: "vacation"
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Vacation"
                },
                value: "vacation"
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
                  text: "Sick"
                },
                value: "sick"
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
    console.log("context",context)
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
  }
  
}




