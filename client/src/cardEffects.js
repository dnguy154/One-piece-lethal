import { getCardCost, getDisplayedPower } from "./engine/cardRules";
import { canAffordCard, restDonForCost } from "./engine/donRules";
import {
  addCardToTrash,
  findCardByInstanceId,
  removeCardFromBoard
} from "./engine/gameState";

export const cardEffects = {
  "OP05-020": {
    id: "OP05-020",
    name: "OP05-020 Effect",
    requiresTargets: true,
    steps: [
      {
        id: "buff_target",
        type: "buff_power",
        amount: 2000,
        prompt: "Choose your leader or character to give +2000 power.",
        targetRules: {
          sides: ["you"],
          zones: ["leader", "board"]
        }
      },
      {
        id: "ko_target",
        type: "ko_power_or_less",
        maxPower: 2000,
        prompt: "Choose an opponent character with 2000 power or less to KO.",
        targetRules: {
          sides: ["opponent"],
          zones: ["board"]
        }
      }
    ]
  }
};

export function getCardEffect(card) {
  if (!card) return null;
  return cardEffects[card.cardId || card.id] || null;
}

export function applyOp05020FirstTarget(state, handIndex, buffTargetInstanceId) {
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
  const effect = getCardEffect(sourceCard);

  if (effect?.type !== "buff_then_ko") {
    return {
      nextState,
      success: false,
      message: `${sourceCard.name} does not have this supported effect.`
    };
  }

  if (!canAffordCard(player, sourceCard)) {
    return {
      nextState,
      success: false,
      message: `Not enough active DON to play ${sourceCard.name}.`
    };
  }

  const buffTargetRef = findCardByInstanceId(nextState, buffTargetInstanceId);

  if (
    !buffTargetRef ||
    buffTargetRef.side !== "you" ||
    !["leader", "board"].includes(buffTargetRef.zone)
  ) {
    return {
      nextState,
      success: false,
      message: "Choose your leader or one of your characters."
    };
  }

  buffTargetRef.card.tempPower =
    Number(buffTargetRef.card.tempPower || 0) + effect.buffAmount;

  return {
    nextState,
    success: true,
    message: `${sourceCard.name} gave ${buffTargetRef.card.name} +${effect.buffAmount} power. Now choose an opponent character with ${effect.koMaxPower} power or less to KO.`
  };
}

export function applyOp05020SecondTarget(state, handIndex, koTargetInstanceId) {
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
  const effect = getCardEffect(sourceCard);

  if (effect?.type !== "buff_then_ko") {
    return {
      nextState,
      success: false,
      message: `${sourceCard.name} does not have this supported effect.`
    };
  }

  const koTargetRef = findCardByInstanceId(nextState, koTargetInstanceId);

  if (
    !koTargetRef ||
    koTargetRef.side !== "opponent" ||
    koTargetRef.zone !== "board"
  ) {
    return {
      nextState,
      success: false,
      message: "Choose an opponent character."
    };
  }

  const targetPower = getDisplayedPower(koTargetRef.card);

  if (targetPower > effect.koMaxPower) {
    return {
      nextState,
      success: false,
      message: `${koTargetRef.card.name} has more than ${effect.koMaxPower} power. Choose a valid target.`
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

  addCardToTrash(nextState.opponent, koTargetRef.card);

  nextState.opponent.board = removeCardFromBoard(
    nextState.opponent.board,
    koTargetRef.card.instanceId
  );

  addCardToTrash(player, playedEvent);

  return {
    nextState,
    success: true,
    message: `${playedEvent.name} KO'd ${koTargetRef.card.name}.`
  };
}