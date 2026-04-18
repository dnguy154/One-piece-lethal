const scenarios = [
  {
    id: 1,
    title: "Find Lethal",
    difficulty: "Medium",

    initialState: {
      you: {
        life: 4,
        don: [
          { id: 1, rested: false, attachedTo: null },
          { id: 2, rested: false, attachedTo: null },
          { id: 3, rested: false, attachedTo: null },
          { id: 4, rested: false, attachedTo: null },
          { id: 5, rested: false, attachedTo: null },
          { id: 6, rested: false, attachedTo: null },
          { id: 7, rested: false, attachedTo: null },
          { id: 8, rested: false, attachedTo: null },
          { id: 9, rested: false, attachedTo: null },
          { id: 10, rested: false, attachedTo: null }
        ],
        leader: {
          cardId: "OP15-002",
          instanceId: "you-leader",
          attachedDon: [],
          rested: false
        },
        hand: [{ cardId: "OP05-015" }, { cardId: "OP15-006" }],
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
        life: 1,
        don: [
          { id: 1, rested: false, attachedTo: null },
          { id: 2, rested: false, attachedTo: null },
          { id: 3, rested: false, attachedTo: null }
        ],
        leader: { cardId: "OP15-039", instanceId: "opponent-leader", attachedDon: [], rested: false },
        hand: [{ cardId: "OP15-040" }],
        board: [{ cardId: "OP15-047", instanceId: "opponent-board-1", attachedDon: [], rested: false }, 
        { cardId: "OP15-042", instanceId: "opponent-board-2", attachedDon: [], rested: false }],
        stage: null,
        deckCount: 30,
        trashCount: 0
      }
    },

    steps: [
      {
        id: "step1",
        prompt: "Choose your first action",
        options: [
          {
            label: "Attack Rebecca with Cavendish",
            nextStepId: "step2",
            effects: [
              {
                type: "remove_card",
                target: "opponent.board",
                index: 0
              }
            ],
            feedback: "Correct. Rebecca is removed first."
          },
          {
            label: "Play Cavendish",
            nextStepId: "fail1",
            effects: [],
            feedback: "Wrong order. Clear the blocker first."
          },
          {
            label: "Play Sabo",
            nextStepId: "fail1",
            effects: [],
            feedback: "Wrong order. You commit resources too early."
          }
        ]
      },

      {
        id: "step2",
        prompt: "Now choose the next action",
        options: [
          {
            label: "Play Cavendish",
            nextStepId: "step3",
            effects: [
              {
                type: "move_card_hand_to_board",
                player: "you",
                handIndex: 0
              }
            ],
            feedback: "Correct. Cavendish enters play."
          },
          {
            label: "Attack Leader with Belo Betty",
            nextStepId: "fail1",
            effects: [],
            feedback: "Not yet. Build the winning line first."
          }
        ]
      },

      {
        id: "step3",
        prompt: "Continue the sequence",
        options: [
          {
            label: "Play Sabo",
            nextStepId: "step4",
            effects: [
              {
                type: "create_token_on_board",
                player: "you",
                card: {
                  id: "custom-sabo",
                  name: "Sabo",
                  image: "https://images.ygoprodeck.com/images/cards/6983839.jpg"
                }
              }
            ],
            feedback: "Correct. Sabo is added to the board."
          },
          {
            label: "Attack Leader with Cavendish",
            nextStepId: "fail1",
            effects: [],
            feedback: "Too early. Finish setup first."
          }
        ]
      },

      {
        id: "step4",
        prompt: "Finish the puzzle",
        options: [
          {
            label: "Attack Leader with Cavendish",
            nextStepId: "win",
            effects: [
              {
                type: "change_value",
                path: "opponent.life",
                value: 0
              }
            ],
            feedback: "Correct. Lethal."
          }
        ]
      },

      {
        id: "win",
        prompt: "You win",
        options: [],
        result: "win"
      },

      {
        id: "fail1",
        prompt: "Incorrect line",
        options: [],
        result: "fail"
      }
    ]
  }
];

module.exports = scenarios;