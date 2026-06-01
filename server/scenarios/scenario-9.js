const scenario =
{
    id: 9,
    title: "Find Lethal #9",
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
        enabled: true,
        sourceInstanceId: "opponent-leader",
        requiredAttachedDon: 1,
        targetPower: 7000,
        oncePerTurn: true,
        discardStrategy: "lowest_counter"
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
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "ST24-004"
          },
          {
            cardId: "OP07-026"
          },
          {
            cardId: "OP12-037"
          },
          {
            cardId: "OP14-034"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "ST24-004",
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
            cardId: "OP14-102",
            instanceId: "opponent-life-1",
            traits: []
          }
        ],
        don: [
          {
            id: 1,
            rested: false,
            attachedTo: "opponent-leader"
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
          cardId: "OP11-041",
          instanceId: "opponent-leader",
          attachedDon: [
            1
          ],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "OP14-102"
          },
          {
            cardId: "OP14-104"
          },
          {
            cardId: "OP14-111"
          },
          {
            cardId: "OP14-104"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP13-042",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "EB03-055",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: true,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          }
        ],
        stage: null,
        trash: [
          {
            cardId: "OP14-111"
          },
          {
            cardId: "OP14-104"
          },
          {
            cardId: "OP15-113"
          }
        ],
        deckCount: 40,
        trashCount: 3
      }
    },
    cardAbilities: {
      "you-leader": [
        {
          id: "you_leader_activate_main",
          trigger: "activate_main",
          name: "Scenario Ability",
          steps: [
            {
              id: "rest_target_1780281403717",
              type: "rest_target",
              optional: false,
              prompt: "Choose your leader or board or stage or don to rest.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "leader",
                  "board",
                  "stage",
                  "don"
                ]
              }
            },
            {
              id: "restand_don_1780281414861",
              type: "restand_don",
              player: "you",
              count: 3
            }
          ],
          sourceInstanceId: "you-leader",
          oncePerTurn: true,
          costSteps: []
        }
      ],
      "OP12-037": [
        {
          id: "OP12_037_on_play",
          trigger: "on_play",
          name: "Scenario Ability",
          steps: [
            {
              id: "rest_target_1780281551421",
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
              id: "rest_target_1780281568399",
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
            }
          ],
          additionalCost: {
            restDon: 3
          }
        }
      ],
      "ST24-004": [
        {
          id: "ST24_004_on_play",
          trigger: "on_play",
          name: "Scenario Ability",
          steps: [
            {
              id: "rest_target_1780281783311",
              type: "rest_target",
              optional: false,
              prompt: "Choose an opponent board or don to rest.",
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
              id: "buff_power_1780282581488",
              type: "buff_power",
              amount: 2000,
              optional: false,
              prompt: "Choose your leader to give +2000 power.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "leader"
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
