const scenario =
{
  id: 3,
  title: "Find Lethal #3",
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
        { id: 6, rested: false, attachedTo: null }
      ],
      leader: {
        cardId: "OP15-002",
        instanceId: "you-leader",
        attachedDon: [],
        rested: false
      },
      hand: [
        { cardId: "OP05-019" },
        { cardId: "OP15-052" },
        { cardId: "OP15-046" }
      ],
      deck: [],
      board: [
        {
          cardId: "OP15-048",
          instanceId: "you-board-1",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP15-048",
          instanceId: "you-board-2",
          attachedDon: [],
          rested: false,
          isBlocker: false,
          summoningSick: false
        },
        {
          cardId: "OP15-014",
          instanceId: "you-board-3",
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
          cardId: "OP10-045",
          instanceId: "opponent-life-1"
        },
        {
          cardId: "OP15-048",
          instanceId: "opponent-life-2"
        }
      ],
      don: [
        {
          id: 1,
          rested: false,
          attachedTo: "opponent-board-1"
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
        }
      ],
      leader: {
        cardId: "OP15-002",
        instanceId: "opponent-leader",
        attachedDon: [],
        rested: false
      },
      hand: [
        { cardId: "OP15-053" },
        { cardId: "OP15-052" }
      ],
      deck: [],
      board: [
        {
          cardId: "OP15-053",
          instanceId: "opponent-board-1",
          attachedDon: [1],
          rested: false,
          isBlocker: true,
          summoningSick: false
        },
        {
          cardId: "OP10-045",
          instanceId: "opponent-board-2",
          attachedDon: [],
          rested: true,
          isBlocker: false,
          summoningSick: false
        }
      ],
      stage: null,
      trash: [
        { cardId: "OP15-040" },
        { cardId: "OP15-040" },
        { cardId: "OP15-040" },
        { cardId: "OP15-040" },
        { cardId: "OP15-052" },
        { cardId: "OP15-052" },
        { cardId: "OP15-052" }
      ],
      deckCount: 40,
      trashCount: 7
    }
  },

  cardAbilities: {
    "OP05-019": [
      {
        id: "op05_019_on_play_reduce_then_ko",
        trigger: "on_play",
        name: "Reduce Power Then KO",
        steps: [
          {
            id: "reduce_power_1",
            type: "reduce_power",
            amount: 4000,
            optional: false,
            prompt: "Choose an opponent character to give -4000 power.",
            targetRules: {
              sides: ["opponent"],
              zones: ["board"]
            }
          },
          {
            id: "ko_power_or_less_1",
            type: "ko_power_or_less",
            maxPower: 0,
            optional: true,
            prompt: "Choose an opponent character with 0 power or less to KO, or skip this optional effect.",
            targetRules: {
              sides: ["opponent"],
              zones: ["board"]
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