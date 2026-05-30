const scenario =
{
  id: 5,
  title: "Find Lethal #5",
  difficulty: "Medium",
  goal: {
    type: "win_this_turn"
  },
  opponentAI: {
    counterFromHand: {
      enabled: true,
      allowedZones: [
        "leader",
        "board"
      ],
      strategy: "minimum_to_survive"
    },
    blocker: {
      enabled: true,
      onlyWhenLethal: true
    }
  },
  initialState: {
    you: {
      life: [],
      don: [
        {
          id: 1,
          rested: false,
          attachedTo: null
        },
        {
          id: 2,
          rested: false,
          attachedTo: null
        },
        {
          id: 3,
          rested: false,
          attachedTo: null
        },
        {
          id: 4,
          rested: false,
          attachedTo: null
        },
        {
          id: 5,
          rested: false,
          attachedTo: null
        },
        {
          id: 6,
          rested: false,
          attachedTo: null
        },
        {
          id: 7,
          rested: false,
          attachedTo: null
        },
        {
          id: 8,
          rested: false,
          attachedTo: null
        },
        {
          id: 9,
          rested: false,
          attachedTo: null
        },
        {
          id: 10,
          rested: false,
          attachedTo: null
        }
      ],
      leader: {
        cardId: "OP14-020",
        instanceId: "you-leader",
        attachedDon: [],
        rested: false,
        passivePowerBonus: 1000
      },
      hand: [
        {
          cardId: "EB01-015"
        },
        {
          cardId: "OP07-026"
        },
        {
          cardId: "OP12-037"
        }
      ],
      deck: [],
      board: [
        {
          cardId: "ST24-002",
          instanceId: "you-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP07-026",
          instanceId: "you-board-2",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP07-026",
          instanceId: "you-board-3",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP13-031",
          instanceId: "you-board-4",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        }
      ],
      stage: {
        cardId: "OP14-039",
        instanceId: "you-stage",
        attachedDon: [],
        rested: false
      },
      trash: [],
      deckCount: 40,
      trashCount: 0
    },
    opponent: {
      life: [
        {
          cardId: "OP06-114",
          instanceId: "opponent-life-1"
        }
      ],
      don: [
        {
          id: 1,
          rested: true,
          attachedTo: null
        },
        {
          id: 2,
          rested: true,
          attachedTo: null
        },
        {
          id: 3,
          rested: true,
          attachedTo: null
        },
        {
          id: 4,
          rested: true,
          attachedTo: null
        },
        {
          id: 5,
          rested: true,
          attachedTo: null
        },
        {
          id: 6,
          rested: true,
          attachedTo: null
        },
        {
          id: 7,
          rested: true,
          attachedTo: null
        },
        {
          id: 8,
          rested: true,
          attachedTo: null
        },
        {
          id: 9,
          rested: true,
          attachedTo: null
        },
        {
          id: 10,
          rested: true,
          attachedTo: null
        }
      ],
      leader: {
        cardId: "OP08-098",
        instanceId: "opponent-leader",
        attachedDon: [],
        rested: false
      },
      hand: [
        {
          cardId: "OP08-110"
        },
        {
          cardId: "OP12-103"
        },
        {
          cardId: "OP12-103"
        },
        {
          cardId: "OP15-114"
        },
        {
          cardId: "OP15-114"
        },
        {
          cardId: "OP12-099"
        },
        {
          cardId: "OP08-110"
        }
      ],
      deck: [],
      board: [
        {
          cardId: "EB04-058",
          instanceId: "opponent-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: true,
          summoningSick: false
        },
        {
          cardId: "OP08-099",
          instanceId: "opponent-board-2",
          attachedDon: [],
          rested: true,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP08-099",
          instanceId: "opponent-board-3",
          attachedDon: [],
          rested: true,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP12-099",
          instanceId: "opponent-board-4",
          attachedDon: [],
          rested: true,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "EB04-058",
          instanceId: "opponent-board-5",
          attachedDon: [],
          rested: false,
          isBlocker: true,
          summoningSick: false
        }
      ],
      stage: null,
      trash: [],
      deckCount: 40,
      trashCount: 0
    }
  },
  cardAbilities: {
    "OP12-037": [
      {
        id: "op12_037_on_play_rest_2",
        trigger: "on_play",
        name: "Rest 2 Opponent Cards",
        additionalCost: {
          restDon: 3
        },
        steps: [
          {
            id: "rest_target_1",
            type: "rest_target",
            optional: true,
            prompt: "Choose an opponent character or DON to rest, or skip this optional effect.",
            targetRules: {
              sides: ["opponent"],
              zones: ["board", "don"]
            }
          },
          {
            id: "rest_target_2",
            type: "rest_target",
            optional: true,
            prompt: "Choose another opponent character or DON to rest, or skip this optional effect.",
            targetRules: {
              sides: ["opponent"],
              zones: ["board", "don"]
            }
          }
        ]
      }
    ],

    "you-leader": [
      {
        id: "you_leader_activate_main_1",
        trigger: "activate_main",
        name: "Rest 1 card to restand 3 DON",
        type: "activate_main",
        sourceInstanceId: "you-leader",
        oncePerTurn: true,
        costSteps: [
          {
            id: "rest_any_card_cost_1",
            type: "rest_target",
            optional: false,
            prompt: "Choose one of your active cards or DON to rest.",
            targetRules: {
              sides: ["you"],
              zones: ["leader", "board", "stage", "don"]
            }
          }
        ],
        steps: [
          {
            id: "restand_3_don",
            type: "restand_don",
            player: "you",
            count: 3
          }
        ]
      }
    ]
  },

  steps: [
    {
      id: "start",
      prompt: "Solve the scenario",
      options: []
    },
    {
      id: "win",
      prompt: "You win",
      options: [],
      result: "win"
    },
    {
      id: "fail",
      prompt: "Incorrect line",
      options: [],
      result: "fail"
    }
  ]
};

module.exports = scenario;

