const scenario =
{
    id: 15,
    title: "Find Lethal #15",
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
        oncePerTurn: false,
        discardStrategy: "lowest_counter"
      },
      counterEvents: {
        enabled: true,
        discardStrategy: "lowest_counter",
        cards: {
          "OP09-078": {
            name: "Counter Event +4000 Draw 2",
            cost: 1,
            removeDonCount: 2,
            discardCount: 1,
            discardStrategy: "lowest_counter",
            power: 4000,
            allowedZones: [
              "leader",
              "board"
            ],
            steps: [
              {
                id: "counter_event_draw_1780834423796",
                type: "draw_cards",
                player: "opponent",
                count: 2
              }
            ]
          }
        }
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
            cardId: "EB01-015"
          },
          {
            cardId: "OP12-037"
          }
        ],
        deck: [          {
            cardId: "OP11-054"
          },
          {
            cardId: "OP07-064"
          }
        
        ],
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
          },
          {
            cardId: "OP14-033",
            instanceId: "you-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP14-033",
            instanceId: "you-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP07-026",
            instanceId: "you-board-4",
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
            cardId: "ST18-001",
            instanceId: "opponent-life-1",
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
          cardId: "OP11-040",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "OP09-078"
          },
          {
            cardId: "ST18-001"
          },
          {
            cardId: "ST18-001"
          },
          {
            cardId: "OP09-119"
          }
        ],
        deck: [          {
            cardId: "OP11-054"
          },
          {
            cardId: "OP07-064"
          }
        
        ],
        board: [
          {
            cardId: "OP11-054",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP11-054",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP06-119",
            instanceId: "opponent-board-3",
            attachedDon: [],
            rested: true,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP09-119",
            instanceId: "opponent-board-4",
            attachedDon: [],
            rested: true,
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
      }
    },
    cardAbilities: {
      "OP12-037": [
        {
          id: "OP12_037_on_play",
          trigger: "on_play",
          name: "Rest 2 ",
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
        "you-leader": [
        {
          id: "you_leader_activate_main",
          trigger: "activate_main",
          name: "Rest 1 card/DON to restand 3 DON",
          type: "activate_main",
          sourceInstanceId: "you-leader",
          oncePerTurn: true,
          costSteps: [
            {
              id: "rest_target_cost_1",
              type: "rest_target",
              optional: false,
              prompt: "Choose your leader, character, stage, or DON to rest.",
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
            }
          ],
          steps: [
            {
              id: "restand_don_1",
              type: "restand_don",
              player: "you",
              count: 3
            }
          ]
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
              optional: true,
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
