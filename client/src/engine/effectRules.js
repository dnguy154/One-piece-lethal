import { getCardCost, getDisplayedPower } from "./cardRules";
import { canAffordCard, restDonForCost } from "./donRules";
import {
  addCardToTrash,
  findCardByInstanceId,
  removeCardFromBoard
} from "./gameState";

export function getEffectStep(effect, stepIndex) {
  return effect?.steps?.[stepIndex] || null;
}

export function validateEffectTarget(state, step, targetInstanceId) {
  const targetRef = findCardByInstanceId(state, targetInstanceId);

  if (!targetRef) {
    return {
      valid: false,
      message: "Invalid target."
    };
  }

  const allowedSides = step.targetRules?.sides || [];
  const allowedZones = step.targetRules?.zones || [];

  if (allowedSides.length > 0 && !allowedSides.includes(targetRef.side)) {
    return {
      valid: false,
      message: "Invalid target for this effect."
    };
  }

  if (allowedZones.length > 0 && !allowedZones.includes(targetRef.zone)) {
    return {
      valid: false,
      message: "Invalid target for this effect."
    };
  }

  if (step.type === "ko_power_or_less") {
    const targetPower = getDisplayedPower(targetRef.card);

    if (targetPower > step.maxPower) {
      return {
        valid: false,
        message: `${targetRef.card.name} has more than ${step.maxPower} power. Choose a valid target.`
      };
    }
  }

  return {
    valid: true,
    targetRef
  };
}

export function applyEffectStep(state, step, targetInstanceId) {
  const nextState = structuredClone(state);

    if (step.type === "draw_specific") {
    const playerKey = step.player || "you";
    const playerState = nextState[playerKey];

    if (!playerState) {
      return {
        nextState: state,
        success: false,
        message: "Player state not found."
      };
    }

    playerState.deck = playerState.deck || [];
    playerState.hand = playerState.hand || [];

    const drawnCards = [];

    for (const cardId of step.cardIds || []) {
      const deckIndex = playerState.deck.findIndex(
        (card) => (card.cardId || card.id) === cardId
      );

      if (deckIndex === -1) {
        return {
          nextState: state,
          success: false,
          message: `Could not draw ${cardId}. It is not in the scripted deck.`
        };
      }

      const [drawnCard] = playerState.deck.splice(deckIndex, 1);
      playerState.hand.push(drawnCard);
      drawnCards.push(drawnCard);
    }

    playerState.deckCount = Math.max(
      0,
      Number(playerState.deckCount || 0) - drawnCards.length
    );

    return {
      nextState,
      success: true,
      message: `Drew ${drawnCards
        .map((card) => card.name || card.cardId || card.id)
        .join(", ")}.`
    };
  }

  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;

  switch (step.type) {
    case "buff_power": {
      targetRef.card.tempPower =
        Number(targetRef.card.tempPower || 0) + Number(step.amount || 0);

      return {
        nextState,
        success: true,
        message: `${targetRef.card.name} gets +${step.amount} power.`
      };
    }

    case "ko_power_or_less": {
      addCardToTrash(nextState.opponent, targetRef.card);

      nextState.opponent.board = removeCardFromBoard(
        nextState.opponent.board,
        targetRef.card.instanceId
      );

      return {
        nextState,
        success: true,
        message: `${targetRef.card.name} was KO'd.`
      };
    }

    case "draw_specific": {
  const playerKey = step.player || "you";
  const playerState = nextState[playerKey];

  if (!playerState) {
    return {
      nextState: state,
      success: false,
      message: "Player state not found."
    };
  }

  playerState.deck = playerState.deck || [];
  playerState.hand = playerState.hand || [];

  const drawnCards = [];

  for (const cardId of step.cardIds || []) {
    const deckIndex = playerState.deck.findIndex(
      (card) => (card.cardId || card.id) === cardId
    );

    if (deckIndex === -1) {
      return {
        nextState: state,
        success: false,
        message: `Could not draw ${cardId}. It is not in the scripted deck.`
      };
    }

    const [drawnCard] = playerState.deck.splice(deckIndex, 1);

    playerState.hand.push(drawnCard);
    drawnCards.push(drawnCard);
  }

  playerState.deckCount = Math.max(
    0,
    Number(playerState.deckCount || 0) - drawnCards.length
  );

  return {
    nextState,
    success: true,
    message: `Drew ${drawnCards
      .map((card) => card.name || card.cardId || card.id)
      .join(", ")}.`
  };
}

    default:
      return {
        nextState: state,
        success: false,
        message: `Effect type "${step.type}" is not supported yet.`
      };
  }
  
  
}

export function payAndTrashEvent(state, handIndex) {
  const nextState = structuredClone(state);
  const player = nextState.you;

  if (!player) {
    return {
      nextState,
      success: false,
      message: "Player state not found."
    };
  }

  if (handIndex == null || handIndex < 0 || handIndex >= player.hand.length) {
    return {
      nextState,
      success: false,
      message: "That card is no longer in hand."
    };
  }

  const sourceCard = player.hand[handIndex];

  if (!canAffordCard(player, sourceCard)) {
    return {
      nextState,
      success: false,
      message: `Not enough active DON to play ${sourceCard.name}.`
    };
  }

  const cost = getCardCost(sourceCard);
  const paid = restDonForCost(player, cost);

  if (!paid) {
    return {
      nextState,
      success: false,
      message: `Not enough active DON to play ${sourceCard.name}.`
    };
  }

  const [playedEvent] = player.hand.splice(handIndex, 1);
  addCardToTrash(player, playedEvent);

  return {
    nextState,
    success: true,
    message: `${playedEvent.name} was played.`
  };
}