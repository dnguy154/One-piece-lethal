import {
  getCardCost,
  getDisplayedPower,
  isCharacterCard,
  hasRush,
  canAttack
} from "./cardRules";
import { canAffordCard, restDonForCost } from "./donRules";
import {
  addCardToTrash,
  findCardByInstanceId,
  removeCardFromBoard
} from "./gameState";


function findEffectTargetByInstanceId(state, instanceId) {
  const cardRef = findCardByInstanceId(state, instanceId);

  if (cardRef) {
    return cardRef;
  }

  const donMatch = String(instanceId).match(/^(you|opponent)-don-(\d+)$/);

  if (!donMatch) {
    return null;
  }

  const side = donMatch[1];
  const donId = Number(donMatch[2]);

  const donCard = state?.[side]?.don?.find(
    (don) => Number(don.id) === donId
  );

  if (!donCard) {
    return null;
  }

  return {
    side,
    zone: "don",
    card: donCard
  };
}
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function flattenTraitSource(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(flattenTraitSource);
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(flattenTraitSource);
  }

  return String(value)
    .split(/[\/,|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getCardTraitTexts(card) {
  return [
    card?.traits,
    card?.trait,
    card?.types,
    card?.typeNames,
    card?.family,
    card?.raw?.card_traits,
    card?.raw?.traits,
    card?.raw?.trait,
    card?.raw?.types,
    card?.raw?.family
  ].flatMap(flattenTraitSource);
}

function cardHasTrait(card, requiredTrait) {
  const required = normalizeText(requiredTrait);

  if (!required) return true;

  return getCardTraitTexts(card).some((traitText) => {
    const current = normalizeText(traitText);

    return current.includes(required) || required.includes(current);
  });
}

function cardMatchesPlayFromLifeRules(card, step) {
  if (!card) return false;

  const exactCost =
    step.exactCost != null ? Number(step.exactCost) : null;

  if (exactCost != null && Number(card.cost ?? card.raw?.card_cost) !== exactCost) {
    return false;
  }

  const requiredCardType = normalizeText(step.requiredCardType || "character");

  if (requiredCardType === "character" && !isCharacterCard(card)) {
    return false;
  }

  const requiredTraits = step.requiredTraits || [];

  for (const requiredTrait of requiredTraits) {
    if (!cardHasTrait(card, requiredTrait)) {
      return false;
    }
  }

  return true;
}

function getNextBoardInstanceId(player, side) {
  const existingNumbers = (player.board || [])
    .map((card) => {
      const match = String(card.instanceId || "").match(
        new RegExp(`^${side}-board-(\\d+)`)
      );

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => Number.isFinite(number));

  const nextNumber = Math.max(0, ...existingNumbers) + 1;

  return `${side}-board-${nextNumber}`;
}

function clearAttachedDonFromCard(player, card) {
  const attachedDonIds = Array.isArray(card?.attachedDon)
    ? card.attachedDon
    : [];

  for (const donId of attachedDonIds) {
    const donCard = (player.don || []).find((don) => Number(don.id) === Number(donId));

    if (donCard) {
      donCard.attachedTo = null;
      donCard.rested = true;
    }
  }
}

export function getEffectStep(effect, stepIndex) {
  return effect?.steps?.[stepIndex] || null;
}

export function validateEffectTarget(state, step, targetInstanceId) {
  const targetRef = findEffectTargetByInstanceId(state, targetInstanceId);

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
  if (step.type === "negate_effects") {
  if (targetRef.zone !== "board") {
    return {
      valid: false,
      message: "You can only negate a character's effects."
    };
  }

  const maxCost = Number(step.maxCost ?? Infinity);
  const targetCost = getCardCost(targetRef.card);

  if (targetCost > maxCost) {
    return {
      valid: false,
      message: `${targetRef.card.name || targetRef.card.cardId} costs more than ${maxCost}.`
    };
  }
}

if (step.type === "cannot_attack") {
  if (targetRef.zone !== "board") {
    return {
      valid: false,
      message: "You can only choose a character."
    };
  }

  if (step.maxCost != null) {
    const targetCost = getCardCost(targetRef.card);

    if (targetCost > Number(step.maxCost)) {
      return {
        valid: false,
        message: `That character costs more than ${step.maxCost}.`
      };
    }
  }

  if (step.requireCanAttack && !canAttack(targetRef.card)) {
    return {
      valid: false,
      message: "That character already cannot attack."
    };
  }
}
  if (step.type === "rest_target") {
    if (targetRef.card.rested) {
      return {
        valid: false,
        message: "That target is already rested."
      };
    }

    if (targetRef.zone === "don" && targetRef.card.attachedTo != null) {
      return {
        valid: false,
        message: "You cannot rest attached DON."
      };
    }
  }

  if (step.type === "reduce_cost_to") {
  if (targetRef.zone !== "board") {
    return {
      valid: false,
      message: "You can only change the cost of a character."
    };
  }
}

  if (step.type === "return_target_to_hand") {
  if (targetRef.zone !== "board") {
    return {
      valid: false,
      message: "You can only return a character."
    };
  }

  if (targetRef.side !== "you") {
    return {
      valid: false,
      message: "You can only return one of your own characters."
    };
  }
}

  if (step.type === "ko_power_or_less") {
    const targetPower = getDisplayedPower(targetRef.card, {
      includeAttachedDon: targetRef.side === "you"
    });

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

export function hasValidEffectTarget(state, step) {
  if (!step?.targetRules) return true;

  const possibleTargets = [
    state.you?.leader,
    state.you?.stage,
    ...(state.you?.board || []),

    state.opponent?.leader,
    state.opponent?.stage,
    ...(state.opponent?.board || []),

    ...(state.you?.don || []).map((don) => ({
      ...don,
      instanceId: `you-don-${don.id}`
    })),

    ...(state.opponent?.don || []).map((don) => ({
      ...don,
      instanceId: `opponent-don-${don.id}`
    }))
  ].filter(Boolean);

  return possibleTargets.some((target) => {
    if (!target?.instanceId) return false;

    const validation = validateEffectTarget(state, step, target.instanceId);
    return validation.valid;
  });
}

export function applyEffectStep(state, step, targetInstanceId) {
  const nextState = structuredClone(state);

  if (step.type === "rest_target") {
    const validation = validateEffectTarget(nextState, step, targetInstanceId);

    if (!validation.valid) {
      return {
        nextState: state,
        success: false,
        message: validation.message
      };
    }

    const targetRef = validation.targetRef;

    targetRef.card.rested = true;

    return {
      nextState,
      success: true,
      message:
        targetRef.zone === "don"
          ? "DON rested."
          : `${targetRef.card.name || targetRef.card.cardId} was rested.`
    };
  }

  if (step.type === "return_target_to_hand") {
  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;
  const player = nextState[targetRef.side];

  if (!player) {
    return {
      nextState: state,
      success: false,
      message: "Player state not found."
    };
  }

  clearAttachedDonFromCard(player, targetRef.card);

  const {
    instanceId,
    tempPower,
    rested,
    summoningSick,
    attachedDon,
    ...returnedCard
  } = targetRef.card;

  player.hand = player.hand || [];
  player.hand.push({
    ...returnedCard,
    attachedDon: [],
    rested: false
  });

  player.board = removeCardFromBoard(player.board || [], targetRef.card.instanceId);

  return {
    nextState,
    success: true,
    message: `${targetRef.card.name || targetRef.card.cardId} returned to hand.`
  };
}

if (step.type === "play_top_life_if") {
  const playerKey = step.player || "you";
  const player = nextState[playerKey];

  if (!player) {
    return {
      nextState: state,
      success: false,
      message: "Player state not found."
    };
  }

  if (!Array.isArray(player.life) || player.life.length === 0) {
    return {
      nextState: state,
      success: false,
      message: "There is no top life card to play."
    };
  }

  if ((player.board || []).length >= 5) {
    return {
      nextState: state,
      success: false,
      message: "Your character area is full."
    };
  }

  const topLifeCard = player.life[0];

  if (!cardMatchesPlayFromLifeRules(topLifeCard, step)) {
    return {
      nextState: state,
      success: false,
      message:
        step.failMessage ||
        "The top life card does not meet the play requirements."
    };
  }

  const [playedCard] = player.life.splice(0, 1);

  const newCharacter = {
    ...playedCard,
    instanceId: getNextBoardInstanceId(player, playerKey),
    attachedDon: [],
    rested: false,
    isBlocker: !!playedCard.isBlocker,
    summoningSick: !hasRush(playedCard)
  };

  player.board = [...(player.board || []), newCharacter];

  return {
    nextState,
    success: true,
    message: `${newCharacter.name || newCharacter.cardId} was played from life.`
  };
}

  if (step.type === "restand_don") {
    const playerKey = step.player || "you";
    const count = Number(step.count || 0);

    if (!nextState[playerKey]) {
      return {
        nextState: state,
        success: false,
        message: "Player state not found."
      };
    }

    let remaining = count;

    nextState[playerKey].don = (nextState[playerKey].don || []).map((don) => {
      if (remaining <= 0) return don;

      if (don.rested && don.attachedTo == null) {
        remaining -= 1;

        return {
          ...don,
          rested: false
        };
      }

      return don;
    });

    const restandCount = count - remaining;

    return {
      nextState,
      success: true,
      message: `${restandCount} DON set as active.`
    };
  }

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
  if (step.type === "ko_target") {
  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;
  const player = nextState[targetRef.side];

  if (!player) {
    return {
      nextState: state,
      success: false,
      message: "Player state not found."
    };
  }

  addCardToTrash(player, targetRef.card);

  player.board = removeCardFromBoard(
    player.board || [],
    targetRef.card.instanceId
  );

  return {
    nextState,
    success: true,
    message: `${targetRef.card.name || targetRef.card.cardId} was KO'd.`
  };
}

if (step.type === "reduce_cost_to") {
  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;
  const targetCost = Math.max(0, Number(step.value ?? 0));

  targetRef.card.tempCostOverride = targetCost;

  return {
    nextState,
    success: true,
    message: `${targetRef.card.name || targetRef.card.cardId} cost became ${targetCost}.`
  };
}

if (step.type === "negate_effects") {
  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;

  targetRef.card.effectsNegated = true;

  return {
    nextState,
    success: true,
    message: `${targetRef.card.name || targetRef.card.cardId}'s effects were negated.`
  };
}

if (step.type === "cannot_attack") {
  const validation = validateEffectTarget(nextState, step, targetInstanceId);

  if (!validation.valid) {
    return {
      nextState: state,
      success: false,
      message: validation.message
    };
  }

  const targetRef = validation.targetRef;

  targetRef.card.cannotAttack = true;

  return {
    nextState,
    success: true,
    message: `${targetRef.card.name || targetRef.card.cardId} cannot attack this turn.`
  };
}

if (step.type === "mill_top_deck") {
  const playerKey = step.player || "you";
  const count = Number(step.count || 0);
  const player = nextState[playerKey];

  if (!player) {
    return {
      nextState: state,
      success: false,
      message: "Player state not found."
    };
  }

  player.deck = player.deck || [];
  player.trash = player.trash || [];

  if (count <= 0) {
    return {
      nextState,
      success: true,
      message: "No cards milled."
    };
  }

  if (player.deck.length < count) {
    return {
      nextState: state,
      success: false,
      message: `Not enough scripted deck cards to mill ${count}.`
    };
  }

  const milledCards = player.deck.splice(0, count);

  for (const milledCard of milledCards) {
    addCardToTrash(player, milledCard);
  }

  player.deckCount = Math.max(
    0,
    Number(player.deckCount || 0) - milledCards.length
  );

  player.trashCount = player.trash.length;

  return {
    nextState,
    success: true,
    message: `Milled ${milledCards
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

    case "reduce_power": {
      targetRef.card.tempPower =
        Number(targetRef.card.tempPower || 0) - Number(step.amount || 0);

      return {
        nextState,
        success: true,
        message: `${targetRef.card.name} gets -${step.amount} power.`
      };
    }

    case "ko_power_or_less": {
      if (targetRef.zone !== "board") {
        return {
          nextState: state,
          success: false,
          message: "You can only KO a character."
        };
      }

      addCardToTrash(nextState[targetRef.side], targetRef.card);

      nextState[targetRef.side].board = removeCardFromBoard(
        nextState[targetRef.side].board,
        targetRef.card.instanceId
      );

      return {
        nextState,
        success: true,
        message: `${targetRef.card.name} was KO'd.`
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

export function payAndTrashEvent(state, handIndex, effect = null) {
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

  const extraRestDon = Number(effect?.additionalCost?.restDon || 0);

  if (extraRestDon > 0) {
    const availableExtraDon = nextState.you.don.filter(
      (don) => !don.rested && don.attachedTo == null
    );

    if (availableExtraDon.length < extraRestDon) {
      return {
        nextState: state,
        success: false,
        message: `Not enough active DON. This effect requires ${extraRestDon} additional DON.`
      };
    }

    const extraDonIdsToRest = availableExtraDon
      .slice(0, extraRestDon)
      .map((don) => don.id);

    nextState.you.don = nextState.you.don.map((don) =>
      extraDonIdsToRest.includes(don.id)
        ? {
            ...don,
            rested: true
          }
        : don
    );
  }

  const [playedEvent] = player.hand.splice(handIndex, 1);
  addCardToTrash(player, playedEvent);

  return {
    nextState,
    success: true,
    message: `${playedEvent.name} was played.`
  };
}