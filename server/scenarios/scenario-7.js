const scenario =
{
    id: 7,
    title: "Shambles #7",
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
        life: [
          {
            cardId: "OP07-026",
            instanceId: "you-life-1",
            traits: ["supernovas"]
          }
        ],
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
          cardId: "OP10-022",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false,
          passivePowerBonus: 0
        },
        hand: [
          {
            cardId: "OP10-032"
          }
        ],
        deck: [],
        board: [
          {
            cardId: "EB01-012",
            instanceId: "you-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: false,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "OP10-032",
            instanceId: "you-board-2",
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
            rested: false,
            attachedTo: "opponent-leader"
          },
          {
            id: 10,
            rested: false,
            attachedTo: "opponent-leader"
          }
        ],
        leader: {
          cardId: "OP01-060",
          instanceId: "opponent-leader",
          attachedDon: [
            9,
            10
          ],
          rested: false,
          passivePowerBonus: 0
        },
        hand: [{
            cardId: "ST17-003"
        },
    {         cardId: "ST17-003"}],
        deck: [],
        board: [
          {
            cardId: "ST17-004",
            instanceId: "opponent-board-1",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "ST17-004",
            instanceId: "opponent-board-2",
            attachedDon: [],
            rested: false,
            isBlocker: true,
            summoningSick: false,
            passivePowerBonus: 0
          },
          {
            cardId: "OP07-045",
            instanceId: "opponent-board-3",
            attachedDon: [],
            rested: true,
            isBlocker: false,
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
    cardAbilities: {
      "you-leader": [
        {
          id: "you_leader_activate_main_play_life_supernova",
          trigger: "activate_main",
          name: "DON!! x1: Return 1 character, play 5-cost Supernovas from life",
          type: "activate_main",
          sourceInstanceId: "you-leader",
          oncePerTurn: true,
          requirements: {
            sourceAttachedDon: 1
          },
          costSteps: [
            {
              id: "return_friendly_character_cost_1",
              type: "return_target_to_hand",
              optional: false,
              prompt: "Choose one of your characters to return to hand.",
              targetRules: {
                sides: [
                  "you"
                ],
                zones: [
                  "board"
                ]
              }
            }
          ],
          steps: [
            {
              id: "play_top_life_5_cost_supernovas",
              type: "play_top_life_if",
              player: "you",
              exactCost: 5,
              requiredCardType: "character",
              requiredTraits: [
                "Supernovas"
              ],
              failMessage: "Top life is not a 5-cost Supernovas character."
            }
          ]
        }
      ],
      "EB01-012": [
        {
          id: "EB01_012_when_attacking",
          trigger: "when_attacking",
          name: "Scenario Ability",
          steps: [
            {
              id: "restand_don_1780140811202",
              type: "restand_don",
              player: "you",
              count: 2
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
