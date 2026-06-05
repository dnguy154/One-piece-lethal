const scenario =
{
    id: 13,
    title: "Find Lethal #13",
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
          cardId: "OP09-001",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "OP01-025"
          },
          {
            cardId: "OP09-015"
          },
          {
            cardId: "OP09-008"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP09-015",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP12-008",
            instanceId: "you-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP09-006",
            instanceId: "you-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0,
            traits: []
          },
          {
            cardId: "OP12-008",
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
            cardId: "OP03-086",
            instanceId: "opponent-life-1",
            traits: []
          },
          {
            cardId: "EB01-043",
            instanceId: "opponent-life-2",
            traits: []
          },
          {
            cardId: "EB01-043",
            instanceId: "opponent-life-3",
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
          cardId: "OP07-079",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0,
          traits: []
        },
        hand: [
          {
            cardId: "OP03-081"
          },
          {
            cardId: "OP03-086"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP05-091",
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
      "OP01-025": [
        {
          id: "OP01_025_on_play",
          trigger: "on_play",
          name: "rush",
          steps: [
            {
              id: "grant_rush_1780664332388",
              type: "grant_rush",
              targetSelf: true,
              rushType: "normal",
              optional: false
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
