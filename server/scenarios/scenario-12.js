const scenario =
{
    id: 12,
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
                cardId: "OP07-001",
                instanceId: "you-leader",
                attachedDon: [],
                rested: false,
                passivePowerBonus: 0,
                traits: []
            },
            hand: [
                {
                    cardId: "OP05-005"
                },
                {
                    cardId: "OP05-005"
                }
            ],
            deck: [],
            board: [
                {
                    cardId: "OP04-118",
                    instanceId: "you-board-1",
                    attachedDon: [],
                    rested: false,
                    isBlocker: false,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "OP05-008",
                    instanceId: "you-board-2",
                    attachedDon: [],
                    rested: false,
                    isBlocker: false,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                          {
            cardId: "OP05-012",
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
            trash: [],
            deckCount: 40,
            trashCount: 0
        },
        opponent: {
            life: [
                {
                    cardId: "OP13-015",
                    instanceId: "opponent-life-1",
                    traits: []
                },
                {
                    cardId: "OP13-015",
                    instanceId: "opponent-life-2",
                    traits: []
                }
            ],
            don: [{
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
                }],
            leader: {
                cardId: "OP13-003",
                instanceId: "opponent-leader",
                attachedDon: [],
                rested: false,
                passivePowerBonus: 0,
                traits: []
            },
            hand: [
                {
                    cardId: "EB04-002",
                }
            ],
            deck: [],
            board: [
                {
                    cardId: "EB03-010",
                    instanceId: "opponent-board-1",
                    attachedDon: [],
                    rested: false,
                    isBlocker: true,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "EB03-010",
                    instanceId: "opponent-board-2",
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
       "OP05-005": [
  {
    id: "OP05_005_on_play",
    trigger: "on_play",
    name: "On Play reduce -1000 and gain Rush",
    steps: [
      {
        id: "reduce_power_1780573756890",
        type: "reduce_power",
        amount: 1000,
        optional: false,
        prompt: "Choose an opponent leader or character to give -1000 power.",
        targetRules: {
          sides: ["opponent"],
          zones: ["leader", "board"]
        }
      },
      {
        id: "grant_rush_1780575085577",
        type: "grant_rush",
        targetSelf: true,
        rushType: "normal",
        optional: false
      }
    ]
  },
  {
    id: "OP05_005_when_attacking",
    trigger: "when_attacking",
    name: "When Attacking reduce -1000 if 7000+",
    steps: [
      {
        id: "reduce_power_1780000000000",
        type: "reduce_power",
        amount: 1000,
        optional: true,
        sourcePowerAtLeast: 7000,
        prompt: "Choose an opponent leader or character to give -1000 power. Only usable if this attacker is 7000 power or more.",
        targetRules: {
          sides: ["opponent"],
          zones: ["leader", "board"]
        }
      }
    ]
  }
],
        "you-leader": [
            {
                id: "you_leader_activate_main",
                trigger: "activate_main",
                name: "2 don",
                oncePerTurn: true,
                steps: [
                    {
                        id: "select_attached_don_source_...",
                        type: "select_attached_don_source",
                        player: "you",
                        count: 2,
                        optional: true,
                        prompt: "Choose your leader or character with attached DON to move up to 2 DON from, or skip to move 0 DON.",
                        targetRules: {
                            sides: ["you"],
                            zones: ["leader", "board"]
                        }
                    },
                    {
                        id: "move_attached_don_...",
                        type: "move_attached_don",
                        player: "you",
                        count: 2,
                        skipIfNoMoveAttachedDonSource: true,
                        optional: false,
                        prompt: "Choose your character to receive up to 2 attached DON.",
                        targetRules: {
                            sides: ["you"],
                            zones: ["board"]
                        }
                    }
                ]
            }
        ],
        "OP05-008": [
            {
                id: "OP05_008_activate_main",
                trigger: "activate_main",
                name: "give 2 don",
                oncePerTurn: true,
                requirements: {
                    sourceAttachedDon: 1
                },
                steps: [
                    {
                        id: "attach_rested_don_1780000000000",
                        type: "attach_rested_don",
                        player: "you",
                        count: 2,
                        optional: false,
                        prompt: "Choose your leader or character to attach 2 rested DON to.",
                        targetRules: {
                            sides: ["you"],
                            zones: ["leader", "board"]
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
