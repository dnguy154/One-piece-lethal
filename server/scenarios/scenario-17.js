const scenario =
{
    id: 17,
    title: "GY #17",
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
      },
      leaderTrashBoostOnAttack: {
        enabled: false,
        sourceInstanceId: "opponent-leader",
        requiredAttachedDon: 1,
        targetPower: 7000,
        oncePerTurn: true,
        discardStrategy: "lowest_counter"
      },
      counterEvents: {
        enabled: true,
        discardStrategy: "lowest_counter",
        cards: {}
      }
    },
    initialState: {
      you: {
        life: [
          {
            cardId: "OP01-047",
            instanceId: "you-life-1",
            traits: []
          },
          {
            cardId: "OP10-103",
            instanceId: "you-life-2",
            traits: []
          }
        ],
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
          cardId: "OP10-022",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "ST02-009"
          },
        {
            cardId: "ST02-009"
          },
          {
            cardId: "OP10-103"
          },
          {
            cardId: "OP10-107"
          },
          {
            cardId: "OP06-035"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "EB01-012",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          }
        ],
        stage: null,
        trash: [],
        deckCount: 40,
        trashCount: 0
      },
      opponent: {
        life: [
          {
            cardId: "OP11-101",
            instanceId: "opponent-life-1",
            traits: []
          },
          {
            cardId: "OP10-103",
            instanceId: "opponent-life-2",
            traits: []
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
          cardId: "OP10-099",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "OP11-101"
          },
          {
            cardId: "OP10-114"
          },
          {
            cardId: "OP10-114"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP11-101",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP10-107",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          }
        ],
        stage: null,
        trash: [],
        deckCount: 40,
        trashCount: 0
      }
    },
    cardAbilities: {
      "you-leader": [
        {
          id: "you_leader_activate_main",
          trigger: "activate_main",
          name: "shambles",
          steps: [
            {
              id: "return_target_to_hand_1781177281061",
              type: "return_target_to_hand",
              optional: false,
              prompt: "Choose a character to return to hand.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "board"
                ]
              }
            },
            {
              id: "play_top_life_if_1781177314501",
              type: "play_top_life_if",
              player: "you",
              exactCost: 5,
              requiredCardType: "character",
              requiredTraits: [
              ],
              failMessage: "Top life is not a 5-cost Supernovas character."
            }
          ],
          sourceInstanceId: "you-leader",
          oncePerTurn: true,
          costSteps: [],
          requirements: {
            sourceAttachedDon: 1
          }
        }
      ],
      "EB01-012": [
        {
          id: "EB01_012_on_play",
          trigger: "on_play",
          name: "restand",
          steps: [
            {
              id: "restand_don_1781177365681",
              type: "restand_don",
              player: "you",
              count: 2
            }
          ]
        },
        {
          id: "EB01_012_when_attacking",
          trigger: "when_attacking",
          name: "restand",
          steps: [
            {
              id: "restand_don_1781177380080",
              type: "restand_don",
              player: "you",
              count: 2
            }
          ]
        }
      ],
      "OP06-035": [
        {
          id: "OP06_035_on_play",
          trigger: "on_play",
          name: "take life",
          steps: [
            {
              id: "rest_target_1781177424834",
              type: "rest_target",
              optional: true,
              prompt: "Choose an opponent board or don to rest, or skip this optional effect.",
              targetRules: {
                sides: [
                  "opponent"
                ],
                zones: [
                  "board",
                  "don"
                ]
              }
            },
                        {
              id: "life_to_hand_1781177863738",
              type: "life_to_hand",
              player: "you",
              optional: false
            },
            {
              id: "rest_target_1781177427591",
              type: "rest_target",
              optional: true,
              prompt: "Choose an opponent board or don to rest, or skip this optional effect.",
              targetRules: {
                sides: [
                  "opponent"
                ],
                zones: [
                  "board",
                  "don"
                ]
              }
            },
            {
              id: "grant_rush_1781177430469",
              type: "grant_rush",
              targetSelf: true,
              rushType: "normal",
              optional: true
            }
          ]
        }
      ],
      "OP10-103": [
        {
          id: "OP10_103_on_play",
          trigger: "on_play",
          name: "take life and put back",
          steps: [
            {
              id: "life_to_hand_1781177476155",
              type: "life_to_hand",
              player: "you",
              optional: false
            },
            {
              id: "hand_to_top_life_1781177480795",
              type: "hand_to_top_life",
              player: "you",
              optional: true,
              prompt: "Choose 1 card from your hand to place on top of your life face up.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "hand"
                ]
              }
            }
          ]
        }
      ],
            "OP10-107": [
        {
          id: "OP10_107_on_play",
          trigger: "on_play",
          name: "take life and put back",
          steps: [
            {
              id: "life_to_hand_1781177476155",
              type: "life_to_hand",
              player: "you",
              optional: false
            },
            {
              id: "hand_to_top_life_1781177480795",
              type: "hand_to_top_life",
              player: "you",
              optional: true,
              prompt: "Choose 1 card from your hand to place on top of your life face up.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "hand"
                ]
              }
            }
          ]
        }
      ],
       "ST02-009": [
        {
          id: "ST02_009_on_play",
          trigger: "on_play",
          name: "restand",
          steps: [
            {
              id: "restand_target_1781178228026",
              type: "restand_target",
              optional: true,
              prompt: "Choose your leader or character to set as active.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "board"
                ]
              }
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
