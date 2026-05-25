const scenario =
{
    id: 2,
    title: "Daily Test",
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
          cardId: "OP13-002",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false
        },
        hand: [
          {
            cardId: "OP08-040"
          },
          {
            cardId: "OP08-043"
          }
        ],
        board: [
          {
            cardId: "OP13-042",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false
          },
          {
            cardId: "OP08-047",
            instanceId: "you-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false
          },
          {
            cardId: "OP13-054",
            instanceId: "you-board-3",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false
          },
          {
            cardId: "OP13-054",
            instanceId: "you-board-4",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false
          },
          {
            cardId: "OP13-054",
            instanceId: "you-board-5",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false
          }
        ],
        stage: null,
        deckCount: 23,
        trashCount: 0
      },
      opponent: {
        life: [
          {
            cardId: "OP15-040",
            instanceId: "opponent-life-1"
          },
          {
            cardId: "OP15-052",
            instanceId: "opponent-life-2"
          }
        ],
        don: [],
        leader: {
          cardId: "OP15-002",
          instanceId: "opponent-leader",
          attachedDon: [],
          rested: false
        },
        hand: [
          {
            cardId: "OP15-040"
          },
          {
            cardId: "OP15-014"
          },
          {
            cardId: "OP15-052"
          },
          {
            cardId: "OP15-052"
          },
          {
            cardId: "OP15-048"
          },
          {
            cardId: "OP15-053"
          }
        ],
        board: [
          {
            cardId: "OP15-014",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: true,
            isBlocker: false,
            summoningSick: false
          },
          {
            cardId: "OP15-046",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false
          }
        ],
        stage: null,
        deckCount: 40,
        trashCount: 0
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
