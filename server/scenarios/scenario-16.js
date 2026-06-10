const scenario =
{
    id: 16,
    title: "Find Lethal #16 - Life Flip Rush",
    difficulty: "Hard",
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
      },
      counterEvents: {
        enabled: false,
        discardStrategy: "lowest_counter",
        cards: {}
      }
    },
    initialState: {
      you: {
        life: [
          {
            cardId: "OP01-025",
            instanceId: "you-life-1",
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
          cardId: "ST10-002",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "ST10-004"
          }
        ],
        deck: [
          {
            cardId: "ST01-013"
          }
        ],
        board: [
          {
            cardId: "OP01-025",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP01-013",
            instanceId: "you-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 1000,
            traits: []
          },
          {
            cardId: "ST10-005",
            instanceId: "you-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          }
        ],
        stage: null,
        trash: [        {
            cardId: "ST10-005"
          },
          {
            cardId: "ST10-005"
          },
          {
            cardId: "ST10-005"
          },
          {
            cardId: "ST10-004"
          },
          {
            cardId: "ST10-004"
          },
          {
            cardId: "ST10-004"
          },
          {
            cardId: "ST10-006"
          },
          {
            cardId: "ST10-015"
          },
          {
            cardId: "ST10-015"
          },
          {
            cardId: "ST10-015"
          },
          {
            cardId: "ST10-015"
          },
          {
            cardId: "ST10-011"
          },
          {
            cardId: "ST10-011"
          },
          {
            cardId: "ST10-011"
          },
          {
            cardId: "ST10-011"
          },
          {
            cardId: "ST10-014"
          },
          {
            cardId: "ST10-014"
          },
          {
            cardId: "ST10-014"
          },
          {
            cardId: "ST10-014"
          },
          {
            cardId: "ST10-008"
          },
          {
            cardId: "ST10-008"
          },
          {
            cardId: "ST10-008"
          },
          {
            cardId: "ST10-008"
          },
          {
            cardId: "ST10-009"
          },
          {
            cardId: "ST10-009"
          },
          {
            cardId: "ST10-009"
          },
          {
            cardId: "ST10-009"
          },
          {
            cardId: "ST10-010"
          },
          {
            cardId: "ST10-010"
          },
          {
            cardId: "ST10-010"
          },
          {
            cardId: "ST10-010"
          },
          {
            cardId: "OP01-013"
          },
          {
            cardId: "OP01-013"
          },
          {
            cardId: "OP01-013"
          },
          {
            cardId: "ST10-012"
          },
          {
            cardId: "ST10-012"
          },
          {
            cardId: "ST10-012"
          },
          {
            cardId: "ST10-012"
          },
          {
            cardId: "ST10-007"
          },
          {
            cardId: "ST10-007"
          },
          {
            cardId: "ST10-007"
          },
          {
            cardId: "ST10-007"
          },
          {
            cardId: "OP01-025"
          },
          {
            cardId: "OP01-025"
          }
        ],
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
            rested: true,
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
          cardId: "ST10-001",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "EB04-002"
          },
          {
            cardId: "ST18-001"
          },
          {
            cardId: "OP09-119"
          },
          {
            cardId: "ST10-008"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "ST10-010",
            instanceId: "opponent-board-1",
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
      "ST10-004": [
        {
          id: "ST10_004_on_play",
          trigger: "on_play",
          name: "RUSH ABILITY",
          steps: [
            {
              id: "grant_rush_1781095819935",
              type: "grant_rush",
              targetSelf: true,
              rushType: "normal",
              optional: false
            }
          ]
        }
      ],
      "OP01-025": [
        {
          id: "OP01_025_on_play",
          trigger: "on_play",
          name: "RUSH ABILITY",
          steps: [
            {
              id: "grant_rush_1781095869758",
              type: "grant_rush",
              targetSelf: true,
              rushType: "normal",
              optional: false
            }
          ]
        }
      ],
      "OP01-013": [
        {
          id: "OP01_013_activate_main",
          trigger: "activate_main",
          name: "add life",
          steps: [
            {
              id: "life_to_hand_1781096471451",
              type: "life_to_hand",
              player: "you",
              optional: false,
            },
            {
              id: "buff_power_1781096544524",
              type: "buff_power",
              amount: 2000,
              optional: false,
              targetSelf: true,
              oncePerTurn: true,
              prompt: "Choose your character to give +2000 power.",
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
              id: "attach_rested_don_1781096553235",
              type: "attach_rested_don",
              player: "you",
              count: 2,
              optional: true,
              prompt: "Choose your leader or character to attach 2 rested DON to.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "leader",
                  "board"
                ]
              }
            }
          ],
          sourceInstanceId: "OP01-013",
          oncePerTurn: true,
          costSteps: []
        }
      ],
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
