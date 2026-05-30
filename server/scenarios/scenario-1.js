const scenario =
{
  id: 1,
  title: "Find Lethal #1",
  difficulty: "Medium",
  goal: {
    type: "win_this_turn"
  },
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
      hand: [
        { cardId: "OP05-015" },
        { cardId: "OP15-006" },
        { cardId: "OP05-015" },
        { cardId: "OP05-015" }
      ],
      deck: [
        { cardId: "OP05-015" },
        { cardId: "OP05-015" }
      ],
      board: [
        {
          cardId: "OP10-045",
          instanceId: "you-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP15-046",
          instanceId: "you-board-2",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP15-040",
          instanceId: "you-board-3",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        }
      ],
      stage: null,
      trash: [],
      deckCount: 30,
      trashCount: 0
    },

    opponent: {
      life: [
        {
          cardId: "OP15-040",
          instanceId: "opponent-life-1"
        }
      ],
      don: [
        { id: 1, rested: false, attachedTo: null },
        { id: 2, rested: false, attachedTo: null },
        { id: 3, rested: false, attachedTo: null }
      ],
      leader: {
        cardId: "OP15-039",
        instanceId: "opponent-leader",
        attachedDon: [],
        rested: false
      },
      hand: [
        { cardId: "OP15-040" }
      ],
      deck: [],
      board: [
        {
          cardId: "OP15-047",
          instanceId: "opponent-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: true,
          summoningSick: false
        },
        {
          cardId: "OP15-042",
          instanceId: "opponent-board-2",
          attachedDon: [],
          rested: true,
          isBlocker: false,
          summoningSick: false
        }
      ],
      stage: null,
      trash: [],
      deckCount: 30,
      trashCount: 0
    }
  },

  cardAbilities: {},

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