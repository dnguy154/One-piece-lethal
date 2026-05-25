export const cardEffects = {
  "OP05-020": {
    label: "Give +2000 power to leader",
    activate: ({ state, sourceCard }) => {
      const nextState = structuredClone(state);

      if (nextState.you.leader) {
        nextState.you.leader.tempPower = (nextState.you.leader.tempPower || 0) + 2000;
      }

      return {
        nextState,
        message: `${sourceCard.name} gave your leader +2000 power.`
      };
    }
  },

  "OP08-040": {
    label: "Draw 1 card",
    activate: ({ state, sourceCard }) => {
      const nextState = structuredClone(state);

      if (nextState.you.deckCount > 0) {
        nextState.you.deckCount -= 1;
        nextState.you.hand.push({
          id: "unknown-draw",
          name: "Drawn Card",
          cardId: "unknown"
        });
      }

      return {
        nextState,
        message: `${sourceCard.name} drew 1 card.`
      };
    }
  }
};