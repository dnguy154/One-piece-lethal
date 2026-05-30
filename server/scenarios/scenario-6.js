const scenario =
{
    id: 6,
    title: "Find Lethal #",
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
          }
        ],
        leader: {
          cardId: "OP14-020",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0
        },
        hand: [
          {
            cardId: "EB01-016"
          },
          {
            cardId: "OP01-043"
          },
          {
            cardId: "OP02-028"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP01-033",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "OP07-026",
            instanceId: "you-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "EB04-018",
            instanceId: "you-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "EB04-018",
            instanceId: "you-board-4",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "EB01-016",
            instanceId: "you-board-5",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          }
        ],
        stage: null,
        trash: [],
        deckCount: 40,
        trashCount: 0
      },
      opponent: {
        life: [],
        don: [],
        leader: {
          cardId: "OP11-040",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0
        },
        hand: [
          {
            cardId: "OP02-083"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "OP02-081",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "OP02-081",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "OP02-081",
            instanceId: "opponent-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0
          }
        ],
        stage: null,
        trash: [],
        deckCount: 40,
        trashCount: 0
      }
    },
    effects: {},
    activateMainAbilities: {
      "you-leader": {
        id: "you-leader_activate_main_1780061562067",
        name: "Rest 1 card to restand DON",
        type: "activate_main",
        sourceInstanceId: "you-leader",
        oncePerTurn: true,
        costSteps: [
          {
            id: "rest_cost_1780061562067",
            type: "rest_target",
            optional: false,
            prompt: "Choose a card or DON to rest as the cost.",
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
            id: "restand_don_1780061562067",
            type: "restand_don",
            player: "you",
            count: 3
          }
        ]
      }
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
