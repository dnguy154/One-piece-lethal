const scenario =
  {
    id: 1,
    title: "Find Lethal",
    difficulty: "Medium",
opponentAI: {
  counterFromHand: {
    enabled: true,
    allowedZones: ["leader", "board"],
    strategy: "minimum_to_survive"
  },
    blocker: {
    enabled: true,
    onlyWhenLethal: true
  }
},

    initialState: {
      you: {
        life: 4,
        don: [
          { id: 1, rested: false, attachedTo: null },
          { id: 2, rested: false, attachedTo: null },
          { id: 3, rested: false, attachedTo: null },
          { id: 4, rested: false, attachedTo: null },
          { id: 5, rested: false, attachedTo: null }
        ],
        leader: {
          cardId: "OP15-002",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false
        },
        hand: [{ cardId: "OP05-015" }, { cardId: "OP15-006" }, { cardId: "OP05-015" }, { cardId: "OP05-015" }],
        board: [{
          cardId: "OP10-045",
          instanceId: "you-board-1",
          attachedDon: [],
          rested: false
        }, 
        { cardId: "OP15-046", instanceId: "you-board-2", attachedDon: [], rested: false }, 
        { cardId: "OP15-040", instanceId: "you-board-3", attachedDon: [], rested: false }],
        stage: null,
        deckCount: 30,
        trashCount: 0
      },

      opponent: {
        life: [{cardId: "OP15-040", instanceId: "opponent-life-1"}],
        don: [
          { id: 1, rested: false, attachedTo: null },
          { id: 2, rested: false, attachedTo: null },
          { id: 3, rested: false, attachedTo: null }
        ],
        leader: { cardId: "OP15-039", instanceId: "opponent-leader", attachedDon: [], rested: false },
        hand: [{ cardId: "OP15-040" }],
        board: [{ cardId: "OP15-047", instanceId: "opponent-board-1", attachedDon: [], rested: false, isBlocker:true }, 
        { cardId: "OP15-042", instanceId: "opponent-board-2", attachedDon: [], rested: true }],
        stage: null,
        deckCount: 30,
        trashCount: 0
      }
    },
  };

module.exports = scenario;