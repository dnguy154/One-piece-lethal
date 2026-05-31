const scenario =
{
    id: 8,
    title: "Crocodillo #8",
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
                }
            ],
            leader: {
                cardId: "OP14-079",
                instanceId: "you-leader",
                attachedDon: [],
                rested: false,
                passivePowerBonus: 0,
                traits: []
            },
            hand: [
                {
                    cardId: "OP14-087"
                },
                {
                    cardId: "OP14-086"
                },
                {
                    cardId: "OP14-096"
                },
                {
                    cardId: "OP14-096"
                }
            ],
            deck: [
  { cardId: "OP14-088" },
  { cardId: "OP14-120" }
],
            board: [
                {
                    cardId: "OP14-087",
                    instanceId: "you-board-1",
                    attachedDon: [],
                    rested: false,
                    isBlocker: false,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "OP14-094",
                    instanceId: "you-board-2",
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
            life: [],
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
                    attachedTo: "opponent-board-1"
                }
            ],
            leader: {
                cardId: "OP15-002",
                instanceId: "opponent-leader",
                attachedDon: [],
                rested: false,
                passivePowerBonus: 0,
                traits: []
            },
            hand: [
                {
                    cardId: "OP15-047"
                }
            ],
            deck: [],
            board: [
                {
                    cardId: "OP15-053",
                    instanceId: "opponent-board-1",
                    attachedDon: [
                        10
                    ],
                    rested: false,
                    isBlocker: true,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "OP15-046",
                    instanceId: "opponent-board-2",
                    attachedDon: [],
                    rested: false,
                    isBlocker: true,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "OP15-046",
                    instanceId: "opponent-board-3",
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
         "OP14-096": [
    {
      id: "event_negate_5_cost_or_less",
      trigger: "on_play",
      name: "Rest 2 DON: Negate effects of 1 cost 5 or less character",
      additionalCost: {
        restDon: 2
      },
      steps: [
        {
          id: "negate_cost_5_or_less_character",
          type: "negate_effects",
          maxCost: 5,
          optional: false,
          prompt: "Choose an opponent character with cost 5 or less to negate its effects.",
          targetRules: {
            sides: ["opponent"],
            zones: ["board"]
          }
        }
      ]
    }
  ],
        "you-leader": [
            {
                id: "you_leader_activate_main_ko_reduce_cost_mill",
                trigger: "activate_main",
                name: "KO 1 character, make 1 opponent character cost 0, mill 3",
                type: "activate_main",
                sourceInstanceId: "you-leader",
                oncePerTurn: true,

                costSteps: [
                    {
                        id: "ko_your_character_cost_1",
                        type: "ko_target",
                        optional: false,
                        prompt: "Choose one of your characters to KO.",
                        targetRules: {
                            sides: ["you"],
                            zones: ["board"]
                        }
                    }
                ],

                steps: [
                    {
                        id: "reduce_opponent_character_cost_to_0",
                        type: "reduce_cost_to",
                        value: 0,
                        optional: false,
                        prompt: "Choose an opponent character to make cost 0.",
                        targetRules: {
                            sides: ["opponent"],
                            zones: ["board"]
                        }
                    },
                    {
                        id: "mill_top_2_cards",
                        type: "mill_top_deck",
                        player: "you",
                        count: 2
                    }
                ]
            }
        ]
    }
};

module.exports = scenario;
