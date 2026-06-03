const scenario =
{
    id: 11,
    title: "Find Lethal #11",
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
            oncePerTurn: false,
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
                    cardId: "OP14-093"
                },
                {
                    cardId: "OP14-086"
                },
                {
                    cardId: "OP14-084"
                },
                {
                    cardId: "OP14-120"
                },
                {
                    cardId: "OP05-094"
                }
            ],
            deck: [],
            board: [
                {
                    cardId: "OP14-086",
                    instanceId: "you-board-1",
                    attachedDon: [],
                    rested: false,
                    isBlocker: false,
                    summoningSick: false,
                    passivePowerBonus: 1000,
                    traits: []
                },
                {
                    cardId: "OP14-090",
                    instanceId: "you-board-2",
                    attachedDon: [],
                    rested: false,
                    isBlocker: false,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "OP14-084",
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
            trash: [
                {
                    cardId: "OP14-083"
                },
                {
                    cardId: "OP14-085"
                },
                {
                    cardId: "OP14-085"
                },
                {
                    cardId: "OP14-091"
                },
                {
                    cardId: "OP14-093"
                },
                {
                    cardId: "OP14-086"
                },
                {
                    cardId: "OP14-086"
                },
                {
                    cardId: "OP14-084"
                },
                {
                    cardId: "OP14-084"
                },
                {
                    cardId: "OP14-096"
                },
                {
                    cardId: "OP14-096"
                },
                {
                    cardId: "OP14-120"
                }
            ],
            deckCount: 40,
            trashCount: 12
        },
        opponent: {
            life: [
                {
                    cardId: "OP13-031",
                    instanceId: "opponent-life-1",
                    traits: []
                },
                {
                    cardId: "EB01-015",
                    instanceId: "opponent-life-2",
                    traits: []
                },

            ],
            don: [],
            leader: {
                cardId: "OP14-020",
                instanceId: "opponent-leader",
                attachedDon: [],
                rested: false,
                passivePowerBonus: 0,
                traits: []
            },
            hand: [
                {
                    cardId: "OP14-034"
                },
                {
                    cardId: "ST16-004"
                },
            ],
            deck: [],
            board: [
                {
                    cardId: "PRB02-006",
                    instanceId: "opponent-board-1",
                    attachedDon: [],
                    rested: false,
                    isBlocker: true,
                    summoningSick: false,
                    passivePowerBonus: 0,
                    traits: []
                },
                {
                    cardId: "PRB02-006",
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
        "OP14-090": [
            {
                id: "OP14_090_on_play",
                trigger: "on_play",
                name: "rest",
                steps: [
                    {
                        id: "rest_target_1780454036072",
                        type: "rest_target",
                        optional: false,
                        maxCost: 0,
                        prompt: "Choose an opponent board to rest.",
                        targetRules: {
                            sides: [
                                "opponent"
                            ],
                            zones: [
                                "board"
                            ]
                        }
                    },
                    {
                        id: "grant_rush_1780459662437",
                        type: "grant_rush",
                        targetSelf: true,
                        rushType: "character",
                        optional: false
                    }
                ]
            }
        ],
        "you-leader": [
            {
                id: "you_leader_activate_main",
                trigger: "activate_main",
                name: "croc leader",
                steps: [],
                sourceInstanceId: "you-leader",
                oncePerTurn: false,
                costSteps: [
                    {
                        id: "ko_target_1780454111358",
                        type: "ko_target",
                        optional: false,
                        prompt: "Choose your board to KO.",
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
                        id: "reduce_cost_to_1780454150689",
                        type: "reduce_cost_to",
                        value: 0,
                        optional: true,
                        prompt: "Choose an opponent character to make cost 0.",
                        targetRules: {
                            sides: [
                                "opponent"
                            ],
                            zones: [
                                "board"
                            ]
                        }
                    }
                ]
            }
        ],
        "OP14-084": [
            {
                id: "OP14_084_on_play",
                trigger: "on_play",
                name: "moria",
                steps: [
                    {
                        id: "play_from_trash_1780454280411",
                        type: "play_from_trash",
                        player: "you",
                        manualSelect: true,
                        allowReplace: true,
                        requiredCardType: "character",
                        enterRested: true,
                        optional: true,
                        cardIds: [
                            "OP14-093",
                            "OP14-091",
                            "OP14-083",
                            "OP14-085"
                        ],
                        maxCost: 4
                    },
                    {
                        id: "play_from_trash_1780454281971",
                        type: "play_from_trash",
                        player: "you",
                        manualSelect: true,
                        allowReplace: true,
                        requiredCardType: "character",
                        enterRested: true,
                        optional: true,
                        cardIds: [
                            "OP14-093",
                            "OP14-091",
                            "OP14-083",
                            "OP14-085"
                        ],
                        maxCost: 4
                    }
                ]
            }
        ],
        "OP14-091": [
            {
                id: "OP14_091_on_ko",
                trigger: "on_ko",
                name: "play 5c",
                steps: [
                    {
                        id: "play_from_trash_1780455455790",
                        type: "play_from_trash",
                        player: "you",
                        requiredCardType: "character",
                        manualSelect: true,
                        allowReplace: true,
                        enterRested: false,
                        optional: true,
                        cardIds: [
                            "OP14-086",
                            "OP14-090"
                        ],
                        maxCost: 5
                    }
                ]
            }
        ],
        "OP14-093": [
            {
                id: "OP14_093_on_ko",
                trigger: "on_ko",
                name: "Add character from trash to hand",
                steps: [
                    {
                        id: "trash_to_hand_1780000000000",
                        type: "trash_to_hand",
                        player: "you",
                        requiredCardType: "character",
                        manualSelect: true,
                        optional: true,
                        maxCost: 8,
                        prompt: "Choose a character from your trash to add to hand."
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
