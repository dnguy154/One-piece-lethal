const scenario =
{
  id: 4,
  title: "Stolen puzzle #4",
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
        { id: 1, rested: false, attachedTo: null },
        { id: 2, rested: false, attachedTo: null },
        { id: 3, rested: false, attachedTo: null },
        { id: 4, rested: false, attachedTo: null },
        { id: 5, rested: false, attachedTo: null },
        { id: 6, rested: false, attachedTo: null },
        { id: 7, rested: false, attachedTo: null },
        { id: 8, rested: false, attachedTo: null },
        { id: 9, rested: false, attachedTo: null }
      ],
      leader: {
        cardId: "ST29-001",
        instanceId: "you-leader",
        attachedDon: [],
        rested: false
      },
      hand: [],
      deck: [],
      board: [
        {
          cardId: "OP10-105",
          instanceId: "you-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP06-099",
          instanceId: "you-board-2",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
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
          cardId: "OP10-066",
          instanceId: "opponent-life-1"
        }
      ],
      don: [
        { id: 1, rested: true, attachedTo: null },
        { id: 2, rested: true, attachedTo: null },
        { id: 3, rested: true, attachedTo: null },
        { id: 4, rested: true, attachedTo: null },
        { id: 5, rested: true, attachedTo: null },
        { id: 6, rested: true, attachedTo: null },
        { id: 7, rested: true, attachedTo: null },
        { id: 8, rested: true, attachedTo: null },
        { id: 9, rested: true, attachedTo: null },
        { id: 10, rested: true, attachedTo: null }
      ],
      leader: {
        cardId: "OP14-060",
        instanceId: "opponent-leader",
        attachedDon: [],
        rested: false
      },
      hand: [
        { cardId: "OP10-066" },
        { cardId: "OP10-066" },
        { cardId: "OP10-066" }
      ],
      deck: [],
      board: [],
      stage: null,
      trash: [],
      deckCount: 40,
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