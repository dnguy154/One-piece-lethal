import {
  getDisplayedPower,
  canAttack,
  canAttackCharacterTarget,
  canAttackLeaderTarget,
  getCounterValue,
  canUseBlocker,
  getAvailableBlockers,
  getCardCost,
isCharacterCard,
hasRush
} from "./cardRules";

import {
  findCardByInstanceId,
  getLifeCount,
  removeCardFromBoard,
  takeTopLifeToHand,
  addCardToTrash,
  addCardsToTrash
} from "./gameState";

import {
  getAvailableAttachableDonIds,
  attachDonForSimulation
} from "./donRules";

import {
  ABILITY_TRIGGERS,
  getTriggeredAbility
} from "../cardAbilities";


function getCombatPower(card, side) {
  return getDisplayedPower(card, {
    includeAttachedDon: side === "you"
  });
}
// ==============================
// COMBAT + FULL MINIMAX DEFENSE AI
// ==============================

const MAX_MINIMAX_DEPTH = 2;

function chooseMinimumCounterCards(hand, neededPower) {
  const counterCards = hand
    .map((card, index) => ({
      card,
      index,
      value: getCounterValue(card)
    }))
    .filter((entry) => entry.value > 0);

  let best = null;

  function search(startIndex, chosen, total) {
    if (total >= neededPower) {
      const candidate = {
        chosen: [...chosen],
        total
      };

      if (
        !best ||
        candidate.total < best.total ||
        (candidate.total === best.total && candidate.chosen.length < best.chosen.length)
      ) {
        best = candidate;
      }

      return;
    }

    for (let i = startIndex; i < counterCards.length; i += 1) {
      chosen.push(counterCards[i]);
      search(i + 1, chosen, total + counterCards[i].value);
      chosen.pop();
    }
  }

  search(0, [], 0);
  return best;
}



function getDefenseTypePriority(type, context = {}) {
  const {
    attackerPower = 0,
    targetPower = 0,
    counterUsed = 0,
    lifeBefore = 0,
    lifeAfter = 0
  } = context;

  const neededCounter = Math.max(0, attackerPower - targetPower + 1000);

  switch (type) {
    case "take_life": {
      let score = 0;

      if (neededCounter <= 1000) {
        score -= 100000;
      } else if (neededCounter <= 2000) {
        score += 50000;
      } else if (neededCounter <= 3000) {
        score += 200000;
      } else {
        score += 350000;
      }

      if (lifeBefore > 0) {
        score += 300000;
      }

      if (lifeAfter === 0) {
        score -= 100000;
      }

      return score;
    }

    case "counter": {
      let score = 250000 - counterUsed * 60;

      if (lifeBefore <= 1 && counterUsed <= 2000) {
        score += 400000;
      }

      return score;
    }

    case "block_survive":
      if (lifeBefore > 0) return -900000;
      return 180000;

    case "block_ko":
      if (lifeBefore > 0) return -950000;
      return 100000;

    case "block_counter_save":
      if (lifeBefore > 0) return -1000000 - counterUsed * 80;
      return 50000 - counterUsed * 80;

    case "no_defense_needed":
      return 900000;

    case "character_survived":
      return 850000;

    case "character_ko":
      return 600000;

    case "lose":
      return -9999999;

    default:
      return 0;
  }
}

function scoreDefenseChoice(nextState, defenseOption, context = {}) {
  const lifeBefore = context.lifeBefore ?? 0;
  const lifeAfter = getLifeCount(nextState.opponent.life);

  return (
    scoreOpponentState(nextState) +
    getDefenseTypePriority(defenseOption.type, {
      ...context,
      counterUsed: defenseOption.counterUsed || 0,
      lifeBefore,
      lifeAfter
    })
  );
}

function scoreOpponentState(state) {
  if (state.opponent?.defeated) {
    return -999999999;
  }

  const life = getLifeCount(state.opponent.life);

  const totalCounter = (state.opponent.hand || []).reduce(
    (total, card) => total + getCounterValue(card),
    0
  );

  const activeBlockers = (state.opponent.board || []).filter(canUseBlocker).length;

  const remainingAttackers = generatePossibleAttacks(state).length;

  let score = 0;

  score += life * 100000;
  score += activeBlockers * 25000;
  score += totalCounter * 3;

  if (life === 0 && remainingAttackers > 0) {
    score -= 75000;
  }

  return score;
}

function generatePossibleAttacks(state) {
  const attacks = [];
  const availableDonCount = getAvailableAttachableDonIds(state).length;

  const addAttacksForCard = (attacker) => {
    if (!canAttack(attacker)) return;

    for (let donToAttach = 0; donToAttach <= availableDonCount; donToAttach += 1) {
      const attackState = attachDonForSimulation(
        state,
        attacker.instanceId,
        donToAttach
      );

      const simulatedAttackerRef = findCardByInstanceId(
        attackState,
        attacker.instanceId
      );

      if (!simulatedAttackerRef || !canAttack(simulatedAttackerRef.card)) {
        continue;
      }

if (
  attackState.opponent.leader?.instanceId &&
  canAttackLeaderTarget(simulatedAttackerRef.card)
) {
  attacks.push({
    stateBeforeAttack: attackState,
    attackerId: simulatedAttackerRef.card.instanceId,
    targetId: attackState.opponent.leader.instanceId,
    attachedDonCount: donToAttach
  });
}

      for (const target of attackState.opponent.board || []) {
        if (target.rested || simulatedAttackerRef.card.canAttackActiveCharacters) {
          attacks.push({
            stateBeforeAttack: attackState,
            attackerId: simulatedAttackerRef.card.instanceId,
            targetId: target.instanceId,
            attachedDonCount: donToAttach
          });
        }
      }
    }
  };

  if (state.you.leader) {
    addAttacksForCard(state.you.leader);
  }

  for (const card of state.you.board || []) {
    addAttacksForCard(card);
  }

  return attacks;
}

function createCounterDefenseOption(state, attackerPower, targetRef) {
  const nextState = structuredClone(state);
  const newTargetRef = findCardByInstanceId(nextState, targetRef.card.instanceId);

  if (!newTargetRef) return null;

  const targetPower = getCombatPower(newTargetRef.card, newTargetRef.side);
  const neededCounter = attackerPower - targetPower + 1000;

  if (neededCounter <= 0) {
    return null;
  }

  const selection = chooseMinimumCounterCards(nextState.opponent.hand, neededCounter);

  if (!selection) {
    return null;
  }

  const usedCards = selection.chosen.map((entry) => entry.card);

  const indexesToRemove = selection.chosen
    .map((entry) => entry.index)
    .sort((a, b) => b - a);

  for (const index of indexesToRemove) {
    nextState.opponent.hand.splice(index, 1);
  }

  addCardsToTrash(nextState.opponent, usedCards);

  return {
    nextState,
    message: `Opponent countered with ${usedCards.map((card) => card.name).join(", ")}.`,
    type: "counter",
    counterUsed: selection.total,
    cardsUsed: usedCards.length
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

function matchesPlayFromTrashRules(card, step) {
  if (!card) return false;

  if (Array.isArray(step.cardIds) && step.cardIds.length > 0) {
    const cardId = card.cardId || card.id;
    if (!step.cardIds.includes(cardId)) return false;
  }

  if (step.exactCost != null && getCardCost(card) !== Number(step.exactCost)) {
    return false;
  }

  if (step.maxCost != null && getCardCost(card) > Number(step.maxCost)) {
    return false;
  }

  if (step.requiredCardType === "character" && !isCharacterCard(card)) {
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

function chooseCardFromTrash(player, step) {
  const trash = player.trash || [];

  return trash.findIndex((card) => matchesPlayFromTrashRules(card, step));
}
function getSideFromPriorityId(priorityId) {
  const value = String(priorityId || "");

  if (value.startsWith("you-")) return "you";
  if (value.startsWith("opponent-")) return "opponent";

  return null;
}

function getAutoTargetCandidates(state, step, options = {}) {
  const ignoreSideRules = !!options.ignoreSideRules;

  const allowedSides = step.targetRules?.sides || [];
  const allowedZones = step.targetRules?.zones || [];

  const candidates = [];

  for (const side of ["you", "opponent"]) {
    if (
      !ignoreSideRules &&
      allowedSides.length > 0 &&
      !allowedSides.includes(side)
    ) {
      continue;
    }

    const player = state[side];
    if (!player) continue;

    if (allowedZones.includes("leader") && player.leader) {
      candidates.push({
        side,
        zone: "leader",
        card: player.leader
      });
    }

    if (allowedZones.includes("stage") && player.stage) {
      candidates.push({
        side,
        zone: "stage",
        card: player.stage
      });
    }

    if (allowedZones.includes("board")) {
      for (const card of player.board || []) {
        candidates.push({
          side,
          zone: "board",
          card
        });
      }
    }
  }

  return candidates;
}

function isValidAutoTarget(candidate, step, options = {}) {
  if (!candidate?.card) return false;

  const ignoreSideRules = !!options.ignoreSideRules;
  const allowedSides = step.targetRules?.sides || [];
  const allowedZones = step.targetRules?.zones || [];

  if (
    !ignoreSideRules &&
    allowedSides.length > 0 &&
    !allowedSides.includes(candidate.side)
  ) {
    return false;
  }

  if (
    allowedZones.length > 0 &&
    !allowedZones.includes(candidate.zone)
  ) {
    return false;
  }

if (step.type === "cannot_attack") {
  if (candidate.zone !== "board") return false;

  if (step.maxCost != null) {
    const targetCost = getCardCost(candidate.card);

    if (targetCost > Number(step.maxCost)) {
      return false;
    }
  }

  if (step.requireCanAttack && !canAttack(candidate.card)) {
    return false;
  }

  return true;
}

  if (step.type === "ko_power_or_less") {
    return (
      candidate.zone === "board" &&
      getDisplayedPower(candidate.card, {
        includeAttachedDon: candidate.side === "you"
      }) <= Number(step.maxPower)
    );
  }

  if (step.type === "rest_target") {
    return !candidate.card.rested;
  }

  return true;
}

function findAutoTarget(state, step) {
  const priorityIds = Array.isArray(step.targetPriorityIds)
    ? step.targetPriorityIds
    : [];

      if (step.type === "cannot_attack" && step.targetPriorityMode === "highest_power") {
    const candidates = getAutoTargetCandidates(state, step)
      .filter((candidate) => isValidAutoTarget(candidate, step));

    if (candidates.length === 0) {
      return null;
    }

    return [...candidates].sort((a, b) => {
      const powerA = getDisplayedPower(a.card, {
        includeAttachedDon: a.side === "you"
      });

      const powerB = getDisplayedPower(b.card, {
        includeAttachedDon: b.side === "you"
      });

      if (powerA !== powerB) {
        return powerB - powerA;
      }

      const costA = getCardCost(a.card);
      const costB = getCardCost(b.card);

      if (costA !== costB) {
        return costB - costA;
      }

      return String(a.card.instanceId || "").localeCompare(
        String(b.card.instanceId || "")
      );
    })[0];
  }

  if (priorityIds.length > 0) {
    const priorityCandidates = getAutoTargetCandidates(state, step, {
      ignoreSideRules: true
    });

    for (const priorityId of priorityIds) {
      const priorityTarget = priorityCandidates.find(
        (candidate) =>
          candidate.card?.instanceId === priorityId ||
          candidate.card?.cardId === priorityId ||
          candidate.card?.id === priorityId
      );

      if (
        priorityTarget &&
        isValidAutoTarget(priorityTarget, step, {
          ignoreSideRules: true
        })
      ) {
        return priorityTarget;
      }
    }

    const inferredSides = [
      ...new Set(priorityIds.map(getSideFromPriorityId).filter(Boolean))
    ];

    if (inferredSides.length > 0) {
      const fallbackStep = {
        ...step,
        targetRules: {
          ...(step.targetRules || {}),
          sides: inferredSides
        }
      };

      const fallbackCandidates = getAutoTargetCandidates(state, fallbackStep);

      return (
        fallbackCandidates.find((candidate) =>
          isValidAutoTarget(candidate, fallbackStep)
        ) || null
      );
    }
  }

  const candidates = getAutoTargetCandidates(state, step);

  return candidates.find((candidate) => isValidAutoTarget(candidate, step)) || null;
}

function applyAutoTargetStep(state, step) {
  const nextState = structuredClone(state);
  const target = findAutoTarget(nextState, step);

  if (!target) {
    return {
      nextState: state,
      success: false,
      message: "No valid automatic target."
    };
  }

  const player = nextState[target.side];

  if (step.type === "rest_target") {
    target.card.rested = true;

    return {
      nextState,
      success: true,
      message: `${target.card.name || target.card.cardId} was rested.`
    };
  }

if (step.type === "cannot_attack") {
  target.card.cannotAttack = true;

  return {
    nextState,
    success: true,
    message: `${target.card.name || target.card.cardId} cannot attack this turn.`
  };
}
  if (step.type === "buff_power") {
    target.card.tempPower = Number(target.card.tempPower || 0) + Number(step.amount || 0);

    return {
      nextState,
      success: true,
      message: `${target.card.name || target.card.cardId} gained +${step.amount} power.`
    };
  }

  if (step.type === "reduce_power") {
    target.card.tempPower = Number(target.card.tempPower || 0) - Number(step.amount || 0);

    return {
      nextState,
      success: true,
      message: `${target.card.name || target.card.cardId} got -${step.amount} power.`
    };
  }

  if (step.type === "reduce_cost_to") {
    target.card.tempCostOverride = Math.max(0, Number(step.value || 0));

    return {
      nextState,
      success: true,
      message: `${target.card.name || target.card.cardId} became cost ${step.value}.`
    };
  }

  if (step.type === "ko_target" || step.type === "ko_power_or_less") {
    addCardToTrash(player, target.card);

    player.board = removeCardFromBoard(
      player.board || [],
      target.card.instanceId
    );

    return {
      nextState,
      success: true,
      message: `${target.card.name || target.card.cardId} was KO'd.`
    };
  }

  return {
    nextState: state,
    success: false,
    message: `Unsupported auto target step: ${step.type}`
  };
}

function resolveAutomaticAbility(state, ability, scenario, sourceCard) {
  let workingState = structuredClone(state);
  const messages = [];

  const steps = [
    ...(ability.costSteps || []),
    ...(ability.steps || [])
  ];

  for (const step of steps) {
    if (step.type === "play_from_trash") {
      const playerKey = step.player || "opponent";
      const player = workingState[playerKey];

      if (!player) continue;

      if ((player.board || []).length >= 5) {
        messages.push("Character area is full.");
        continue;
      }

      const trashIndex = chooseCardFromTrash(player, step);

      if (trashIndex < 0) {
        messages.push("No valid card in trash to play.");
        continue;
      }

      const [playedCard] = player.trash.splice(trashIndex, 1);

      player.trashCount = player.trash.length;

const entersRested = !!step.enterRested;

const newCharacter = {
  ...playedCard,
  instanceId: getNextBoardInstanceId(player, playerKey),
  attachedDon: [],
  rested: entersRested,
  isBlocker: !!playedCard.isBlocker,
  summoningSick: !hasRush(playedCard)
};

      player.board = [...(player.board || []), newCharacter];

      messages.push(
  `${newCharacter.name || newCharacter.cardId} was played from trash ${
    entersRested ? "rested" : "active"
  }.`
);

      const onPlayAbility = getTriggeredAbility(
        newCharacter,
        scenario,
        ABILITY_TRIGGERS.ON_PLAY
      );

      if (onPlayAbility) {
        const onPlayResult = resolveAutomaticAbility(
          workingState,
          onPlayAbility,
          scenario,
          newCharacter
        );

        workingState = onPlayResult.nextState;
        messages.push(...onPlayResult.messages);
      }

      continue;
    }

    if (step.targetRules) {
      const result = applyAutoTargetStep(workingState, step);

      if (result.success) {
        workingState = result.nextState;
        messages.push(result.message);
      }

      continue;
    }

    if (step.type === "restand_don") {
      const playerKey = step.player || "opponent";
      const player = workingState[playerKey];
      const count = Number(step.count || 0);

      let restanded = 0;

      player.don = (player.don || []).map((don) => {
        if (restanded >= count || !don.rested || don.attachedTo != null) {
          return don;
        }

        restanded += 1;
        return {
          ...don,
          rested: false
        };
      });

      messages.push(`${restanded} DON restanded.`);
    }
  }

  return {
    nextState: workingState,
    messages
  };
}

function resolveOpponentLifeTrigger(state, lifeCard, scenario) {
  const triggerAbility = getTriggeredAbility(
    lifeCard,
    scenario,
    ABILITY_TRIGGERS.LIFE_TRIGGER
  );

  if (!triggerAbility) {
    return {
      nextState: state,
      triggered: false,
      message: ""
    };
  }

  let nextState = structuredClone(state);

  addCardToTrash(nextState.opponent, lifeCard);

  const result = resolveAutomaticAbility(
    nextState,
    triggerAbility,
    scenario,
    lifeCard
  );

  return {
    nextState: result.nextState,
    triggered: true,
    message: `Opponent activated trigger from ${lifeCard.name || lifeCard.cardId}. ${result.messages.join(" ")}`
  };
}


function restAttackerForTriggerTiming(state, attackerId) {
  if (!attackerId) return;

  const attackerRef = findCardByInstanceId(state, attackerId);

  if (attackerRef?.side === "you") {
    attackerRef.card.rested = true;
  }
}

function createTakeLifeDefenseOption(state, scenario = null, attackerId = null) {
  const actualState = structuredClone(state);
  const evaluationState = structuredClone(state);

  // Both states should rest the attacker for correct timing.
  restAttackerForTriggerTiming(actualState, attackerId);
  restAttackerForTriggerTiming(evaluationState, attackerId);

  if (getLifeCount(actualState.opponent.life) > 0) {
    const actualLifeCard = Array.isArray(actualState.opponent.life)
      ? actualState.opponent.life.shift()
      : null;

    const evaluationLifeCard = Array.isArray(evaluationState.opponent.life)
      ? evaluationState.opponent.life.shift()
      : null;

    // OLD AI LOGIC:
    // For evaluation only, taking life just adds the card to hand.
    // No trigger is considered here.
    if (evaluationLifeCard) {
      evaluationState.opponent.hand = evaluationState.opponent.hand || [];
      evaluationState.opponent.hand.push(evaluationLifeCard);
    } else {
      takeTopLifeToHand(evaluationState.opponent);
    }

    // REAL GAMEPLAY:
    // If the AI actually chooses take life, trigger resolves here.
    if (actualLifeCard) {
      const triggerResult = resolveOpponentLifeTrigger(
        actualState,
        actualLifeCard,
        scenario
      );

      if (triggerResult.triggered) {
        return {
          nextState: triggerResult.nextState,
          evaluationState,
          message: triggerResult.message,
          evaluationMessage: "Opponent took 1 life into hand.",
          type: "take_life"
        };
      }

      actualState.opponent.hand = actualState.opponent.hand || [];
      actualState.opponent.hand.push(actualLifeCard);

      return {
        nextState: actualState,
        evaluationState,
        message: "Opponent took 1 life into hand.",
        evaluationMessage: "Opponent took 1 life into hand.",
        type: "take_life"
      };
    }

    takeTopLifeToHand(actualState.opponent);

    return {
      nextState: actualState,
      evaluationState,
      message: "Opponent took 1 life into hand.",
      evaluationMessage: "Opponent took 1 life into hand.",
      type: "take_life"
    };
  }

  actualState.opponent.defeated = true;
  evaluationState.opponent.defeated = true;

  return {
    nextState: actualState,
    evaluationState,
    message: "Opponent could not defend lethal.",
    evaluationMessage: "Opponent could not defend lethal.",
    type: "lose"
  };
}

function createBlockDefenseOptions(state, attackerPower, scenario = null) {
  const blockerConfig = scenario?.opponentAI?.blocker;

  if (!blockerConfig?.enabled) {
    return [];
  }

  const opponentLife = getLifeCount(state.opponent.life);
  const isLethalSwing = opponentLife <= 0;

  // Important:
  // If onlyWhenLethal is true, do not even generate block options
  // while the opponent still has life.
  if (blockerConfig.onlyWhenLethal && !isLethalSwing) {
    return [];
  }

  const options = [];
  const blockers = getAvailableBlockers(state.opponent.board);

  for (const blocker of blockers) {
    const blockedState = structuredClone(state);
    const blockedRef = findCardByInstanceId(blockedState, blocker.instanceId);

    if (!blockedRef) continue;

    const blockedCard = blockedRef.card;
    blockedCard.rested = true;

    const blockerPower = getCombatPower(blockedCard, "opponent");

    if (attackerPower >= blockerPower) {
      addCardToTrash(blockedState.opponent, blockedCard);

      blockedState.opponent.board = removeCardFromBoard(
        blockedState.opponent.board,
        blockedCard.instanceId
      );

      options.push({
        nextState: blockedState,
        message: `${blockedCard.name} blocked and was KO'd.`,
        type: "block_ko"
      });
    } else {
      options.push({
        nextState: blockedState,
        message: `${blockedCard.name} blocked and survived.`,
        type: "block_survive"
      });
    }

    if (attackerPower >= blockerPower) {
      const counterSaveState = structuredClone(state);
      const counterBlockerRef = findCardByInstanceId(
        counterSaveState,
        blocker.instanceId
      );

      if (!counterBlockerRef) continue;

      counterBlockerRef.card.rested = true;

      const targetPower = getCombatPower(
        counterBlockerRef.card,
        counterBlockerRef.side
      );

      const neededCounter = attackerPower - targetPower + 1000;

      const selection = chooseMinimumCounterCards(
        counterSaveState.opponent.hand,
        neededCounter
      );

      if (selection) {
        const usedCards = selection.chosen.map((entry) => entry.card);

        const indexesToRemove = selection.chosen
          .map((entry) => entry.index)
          .sort((a, b) => b - a);

        for (const index of indexesToRemove) {
          counterSaveState.opponent.hand.splice(index, 1);
        }

        addCardsToTrash(counterSaveState.opponent, usedCards);

        options.push({
          nextState: counterSaveState,
          message: `${blocker.name} blocked. Opponent countered with ${usedCards
            .map((card) => card.name)
            .join(", ")} to save it.`,
          type: "block_counter_save",
          counterUsed: selection.total,
          cardsUsed: usedCards.length
        });
      }
    }
  }

  return options;
}

function createBoardBattleNoCounterOption(state, attackerPower, targetRef) {
  const nextState = structuredClone(state);
  const newTargetRef = findCardByInstanceId(nextState, targetRef.card.instanceId);

  if (!newTargetRef) return null;

  const targetPower = getCombatPower(newTargetRef.card, newTargetRef.side);

  if (attackerPower >= targetPower) {
    addCardToTrash(nextState.opponent, newTargetRef.card);

    nextState.opponent.board = removeCardFromBoard(
      nextState.opponent.board,
      newTargetRef.card.instanceId
    );

    return {
      nextState,
      message: `${newTargetRef.card.name} was KO'd.`,
      type: "character_ko"
    };
  }

  return {
    nextState,
    message: `${newTargetRef.card.name} survived the attack.`,
    type: "character_survived"
  };
}

function generateDefenseOptions(state, attackerId, targetId, scenario = null) {
  const attackerRef = findCardByInstanceId(state, attackerId);
  const targetRef = findCardByInstanceId(state, targetId);

  if (!attackerRef || !targetRef) return [];

  const attacker = attackerRef.card;
  const target = targetRef.card;
const attackerPower = getCombatPower(attacker, attackerRef.side);
const targetPower = getCombatPower(target, targetRef.side);

  const options = [];

  if (attackerPower < targetPower) {
    const nextState = structuredClone(state);

    options.push({
      nextState,
      message: `${target.name} survived because the attacker did not have enough power.`,
      type: "no_defense_needed"
    });

    return options;
  }

  const counterOption = createCounterDefenseOption(state, attackerPower, targetRef);

  if (counterOption) {
    options.push(counterOption);
  }

  if (targetRef.zone === "leader") {
    options.push(createTakeLifeDefenseOption(state, scenario, attackerId));

    const blockOptions = createBlockDefenseOptions(state, attackerPower, scenario);
    options.push(...blockOptions);
  }

  if (targetRef.zone === "board") {
    const boardBattleOption = createBoardBattleNoCounterOption(
      state,
      attackerPower,
      targetRef
    );

    if (boardBattleOption) {
      options.push(boardBattleOption);
    }
  }

  return options;
}

function applyAttackWithDefense(state, attackerId, defenseOption) {
  const nextState = structuredClone(defenseOption.nextState);
  const attackerRef = findCardByInstanceId(nextState, attackerId);

  if (attackerRef) {
    attackerRef.card.rested = true;
  }

  return nextState;
}

function playerCanForceWin(state, depth = 0, scenario = null) {
  if (state.opponent?.defeated) {
    return true;
  }

  if (depth >= MAX_MINIMAX_DEPTH) {
    return false;
  }

  const attacks = generatePossibleAttacks(state);

  if (attacks.length === 0) {
    return false;
  }

  for (const attack of attacks) {
    const defenseResult = chooseBestOpponentDefense(
      attack.stateBeforeAttack,
      attack.attackerId,
      attack.targetId,
      depth,
      scenario 
    );

    if (defenseResult.playerStillForcesWin) {
      return true;
    }
  }

  return false;
}

function getLifeCountSafe(life) {
  return Array.isArray(life) ? life.length : Number(life || 0);
}

function getActiveUnattachedDonCount(state) {
  return (state.you?.don || []).filter(
    (don) => !don.rested && don.attachedTo == null
  ).length;
}

function getLeaderDefensePower(card, side) {
  return getDisplayedPower(card, {
    includeAttachedDon: side === "you"
  });
}

function getFutureAttackers(state) {
  const attackers = [];

  if (state.you?.leader && canAttack(state.you.leader)) {
    attackers.push({
      id: state.you.leader.instanceId,
      power: getDisplayedPower(state.you.leader, { includeAttachedDon: true })
    });
  }

  for (const card of state.you?.board || []) {
    if (canAttack(card)) {
      attackers.push({
        id: card.instanceId,
        power: getDisplayedPower(card, { includeAttachedDon: true })
      });
    }
  }

  return attackers;
}

function getCounterValuesFromHand(hand = []) {
  return hand
    .map((card) => getCounterValue(card))
    .filter((value) => value > 0)
    .sort((a, b) => b - a);
}

function getMinimumCounterDefenses(counterValues, needed) {
  if (needed <= 0) {
    return [counterValues];
  }

  const results = [];
  let bestTotal = Infinity;

  function backtrack(index, chosenIndexes, total) {
    if (results.length > 20) return;

    if (total >= needed) {
      if (total < bestTotal) {
        bestTotal = total;
        results.length = 0;
      }

      if (total === bestTotal) {
        const chosenSet = new Set(chosenIndexes);
        const remaining = counterValues.filter((_, i) => !chosenSet.has(i));
        results.push(remaining);
      }

      return;
    }

    if (index >= counterValues.length) return;
    if (total > bestTotal) return;

    backtrack(index + 1, [...chosenIndexes, index], total + counterValues[index]);
    backtrack(index + 1, chosenIndexes, total);
  }

  backtrack(0, [], 0);

  return results;
}

function canPlayerForceLeaderLethalLight(state) {
  if (state.opponent?.defeated) {
    return true;
  }

  const opponentLife = getLifeCountSafe(state.opponent?.life);
  const opponentLeaderPower = getLeaderDefensePower(
    state.opponent?.leader,
    "opponent"
  );

  const availableDon = getActiveUnattachedDonCount(state);
  const attackers = getFutureAttackers(state);
  const counters = getCounterValuesFromHand(state.opponent?.hand || []);

  const memo = new Map();

  function dfs(attackerPowers, donCount, lifeCount, counterValues) {
    const key = JSON.stringify({
      attackerPowers: [...attackerPowers].sort((a, b) => a - b),
      donCount,
      lifeCount,
      counterValues: [...counterValues].sort((a, b) => a - b)
    });

    if (memo.has(key)) return memo.get(key);

    if (attackerPowers.length === 0) {
      memo.set(key, false);
      return false;
    }

    for (let attackerIndex = 0; attackerIndex < attackerPowers.length; attackerIndex += 1) {
      const basePower = attackerPowers[attackerIndex];

      for (let donToAttach = 0; donToAttach <= donCount; donToAttach += 1) {
        const attackPower = basePower + donToAttach * 1000;

        // In One Piece, defender must exceed attacker power to stop the hit.
        const counterNeeded = attackPower - opponentLeaderPower + 1000;

        if (counterNeeded <= 0) {
          continue;
        }

        const remainingAttackers = attackerPowers.filter(
          (_, index) => index !== attackerIndex
        );

        const defenseBranches = [];

        // Opponent may take if they still have life.
        if (lifeCount > 0) {
          defenseBranches.push({
            life: lifeCount - 1,
            counters: counterValues
          });
        }

        // Opponent may counter if possible.
        const counterBranches = getMinimumCounterDefenses(
          counterValues,
          counterNeeded
        );

        for (const remainingCounters of counterBranches) {
          defenseBranches.push({
            life: lifeCount,
            counters: remainingCounters
          });
        }

        // If opponent has no legal defense branch, this attack is lethal.
        if (defenseBranches.length === 0) {
          memo.set(key, true);
          return true;
        }

        // User forces lethal only if every opponent defense still loses.
        const attackForcesLethal = defenseBranches.every((branch) =>
          dfs(
            remainingAttackers,
            donCount - donToAttach,
            branch.life,
            branch.counters
          )
        );

        if (attackForcesLethal) {
          memo.set(key, true);
          return true;
        }
      }
    }

    memo.set(key, false);
    return false;
  }

  return dfs(
    attackers.map((attacker) => attacker.power),
    availableDon,
    opponentLife,
    counters
  );
}

function roundUpToNearest1000(value) {
  return Math.ceil(Number(value || 0) / 1000) * 1000;
}

function getBalancedRemainingSwingPower(state) {
  const attackers = getFutureAttackers(state);
  const availableDon = getActiveUnattachedDonCount(state);

  if (attackers.length === 0) {
    return 0;
  }

  const totalBasePower = attackers.reduce(
    (total, attacker) => total + Number(attacker.power || 0),
    0
  );

  const totalPotentialPower = totalBasePower + availableDon * 1000;

  return roundUpToNearest1000(totalPotentialPower / attackers.length);
}

function isHighValueTakeLifeOption(evaluatedOption) {
  if (evaluatedOption.defenseOption.type !== "take_life") {
    return false;
  }

  const stateToEvaluate =
    evaluatedOption.evaluationState || evaluatedOption.nextState;

  const lifeAfter = getLifeCount(stateToEvaluate.opponent.life);

  // Do not intentionally go to 0 life if there are still attackers.
  if (lifeAfter <= 0) {
    return false;
  }

  const attackerPower = Number(evaluatedOption.attackerPower || 0);
  const targetPower = Number(evaluatedOption.targetPower || 0);
  const counterNeeded = Math.max(0, attackerPower - targetPower + 1000);

  const balancedRemainingSwingPower =
    getBalancedRemainingSwingPower(stateToEvaluate);

  // If this swing is much bigger than the expected remaining split attacks,
  // take it and save counters for the smaller swings.
  if (
    counterNeeded >= 3000 &&
    attackerPower >= balancedRemainingSwingPower + 2000
  ) {
    return true;
  }

  // Backup rule for huge attacks.
  if (counterNeeded >= 5000) {
    return true;
  }

  return false;
}

function isDangerousTakeLifeOption(evaluatedOption) {
  if (evaluatedOption.defenseOption.type !== "take_life") {
    return false;
  }

  const stateToEvaluate =
    evaluatedOption.evaluationState || evaluatedOption.nextState;

  const lifeAfter = getLifeCount(stateToEvaluate.opponent.life);
  const remainingAttackers = getFutureAttackers(stateToEvaluate).length;

  if (lifeAfter <= 0 && remainingAttackers > 0) {
    return true;
  }

  // Important:
  // MAX_MINIMAX_DEPTH is only 2, so it misses long 5-6 swing lethal lines.
  // This light check sees whether the user can still force leader lethal
  // after opponent takes life.
  if (canPlayerForceLeaderLethalLight(stateToEvaluate)) {
    return true;
  }

  return false;
}
function chooseHighestScoringOption(options) {
  return [...options].sort((a, b) => b.score - a.score)[0] || null;
}

function chooseBestLeaderTrashBoostDefense(options) {
  const leaderBoostOptions = options.filter(
    (option) =>
      option.defenseOption?.usesLeaderTrashBoost &&
      option.defenseOption.type !== "lose"
  );

  if (leaderBoostOptions.length === 0) {
    return null;
  }

  const cleanStopOptions = leaderBoostOptions.filter(
    (option) => option.defenseOption.type === "no_defense_needed"
  );

  if (cleanStopOptions.length > 0) {
    return chooseHighestScoringOption(cleanStopOptions);
  }

  return chooseHighestScoringOption(leaderBoostOptions);
}

function chooseBestNonTakeDefense(options) {
  const leaderBoostOption = chooseBestLeaderTrashBoostDefense(options);

  if (leaderBoostOption) {
    return leaderBoostOption;
  }

  const counterOptions = options.filter(
    (option) => option.defenseOption.type === "counter"
  );

  if (counterOptions.length > 0) {
    return [...counterOptions].sort(
      (a, b) =>
        (a.defenseOption.counterUsed || 0) -
        (b.defenseOption.counterUsed || 0)
    )[0];
  }

  // Only allow blocker as a defensive choice when opponent has 0 life.
  const blockOptions = options.filter(
    (option) =>
      option.defenseOption.type.startsWith("block") &&
      option.lifeBefore <= 0
  );

  if (blockOptions.length > 0) {
    return chooseHighestScoringOption(blockOptions);
  }

  const nonBlockOptions = options.filter(
    (option) => !option.defenseOption.type.startsWith("block")
  );

  return chooseHighestScoringOption(nonBlockOptions);
}
function getAttachedDonCount(card) {
  return Array.isArray(card?.attachedDon) ? card.attachedDon.length : 0;
}

function getLowestCounterHandCardIndex(hand = []) {
  if (!Array.isArray(hand) || hand.length === 0) return -1;

  const options = hand
    .map((card, index) => ({
      card,
      index,
      counter: Number(getCounterValue(card) || 0)
    }))
    .filter((entry) => entry.card);

  if (options.length === 0) return -1;

  options.sort((a, b) => {
    if (a.counter !== b.counter) return a.counter - b.counter;
    return a.index - b.index;
  });

  return options[0].index;
}

function hasUsedOpponentDefenseAbility(state, abilityKey) {
  return (state.opponent?.usedDefenseAbilities || []).includes(abilityKey);
}

function markOpponentDefenseAbilityUsed(state, abilityKey) {
  state.opponent.usedDefenseAbilities =
    state.opponent.usedDefenseAbilities || [];

  if (!state.opponent.usedDefenseAbilities.includes(abilityKey)) {
    state.opponent.usedDefenseAbilities.push(abilityKey);
  }
}

function isLeaderBoostDefenseOption(defenseOption) {
  return (
    defenseOption?.type === "counter" ||
    defenseOption?.type === "no_defense_needed"
  );
}

function buildOpponentLeaderTrashBoostCounterCandidates(
  state,
  attackerId,
  targetId,
  scenario
) {
  const config = scenario?.opponentAI?.leaderTrashBoostOnAttack;

  if (!config?.enabled) return [];

  const targetRef = findCardByInstanceId(state, targetId);

  if (!targetRef || targetRef.side !== "opponent" || targetRef.zone !== "leader") {
    return [];
  }

  const sourceInstanceId = config.sourceInstanceId || "opponent-leader";
  const sourceRef = findCardByInstanceId(state, sourceInstanceId);

  if (!sourceRef || sourceRef.side !== "opponent") {
    return [];
  }

  const requiredAttachedDon = Number(config.requiredAttachedDon || 1);
  const targetPower = Number(config.targetPower || 7000);
  const oncePerTurn = config.oncePerTurn !== false;
  const abilityKey = `${sourceInstanceId}:leader_trash_boost`;

  if (oncePerTurn && hasUsedOpponentDefenseAbility(state, abilityKey)) {
    return [];
  }

  if (getAttachedDonCount(sourceRef.card) < requiredAttachedDon) {
    return [];
  }

  if (!Array.isArray(state.opponent?.hand) || state.opponent.hand.length === 0) {
    return [];
  }

  const currentLeaderPower = getCombatPower(targetRef.card, "opponent");

  if (currentLeaderPower >= targetPower) {
    return [];
  }

  const boostedState = structuredClone(state);
  const boostedTargetRef = findCardByInstanceId(boostedState, targetId);

  if (!boostedTargetRef) return [];

  const discardIndex = getLowestCounterHandCardIndex(boostedState.opponent.hand);

  if (discardIndex < 0) return [];

  const [discardedCard] = boostedState.opponent.hand.splice(discardIndex, 1);

  addCardToTrash(boostedState.opponent, discardedCard);

  boostedTargetRef.card.tempPowerOverride = targetPower;

  markOpponentDefenseAbilityUsed(boostedState, abilityKey);

  const boostedDefenseOptions = generateDefenseOptions(
    boostedState,
    attackerId,
    targetId,
    scenario
  ).filter(isLeaderBoostDefenseOption);

return boostedDefenseOptions.map((defenseOption) => ({
  stateBeforeDefense: boostedState,
  defenseOption: {
    ...defenseOption,
    usesLeaderTrashBoost: true,
    leaderTrashBoostTargetPower: targetPower,
    leaderTrashBoostDiscardedCard: discardedCard,
    message: `Opponent trashed ${
      discardedCard.name || discardedCard.cardId
    } to make leader ${targetPower}. ${defenseOption.message || ""}`.trim()
  }
}));
}

function chooseBestOpponentDefense(
  state,
  attackerId,
  targetId,
  depth = 0,
  scenario = null
) {
  const attackerRef = findCardByInstanceId(state, attackerId);
  const targetRef = findCardByInstanceId(state, targetId);

  if (!attackerRef || !targetRef) {
    return {
      nextState: state,
      message: "Invalid defense state.",
      playerStillForcesWin: false
    };
  }

  const normalDefenseCandidates = generateDefenseOptions(
    state,
    attackerId,
    targetId,
    scenario
  ).map((defenseOption) => ({
    stateBeforeDefense: state,
    defenseOption
  }));

  const leaderTrashBoostCandidates =
    buildOpponentLeaderTrashBoostCounterCandidates(
      state,
      attackerId,
      targetId,
      scenario
    );

  const defenseCandidates = [
    ...normalDefenseCandidates,
    ...leaderTrashBoostCandidates
  ];

  if (defenseCandidates.length === 0) {
    return {
      nextState: state,
      message: "No legal defense found.",
      playerStillForcesWin: false
    };
  }

  const evaluatedOptions = defenseCandidates.map(
  ({ stateBeforeDefense, defenseOption }) => {
    const actualNextState = applyAttackWithDefense(
      stateBeforeDefense,
      attackerId,
      defenseOption
    );

    const evaluationDefenseOption = defenseOption.evaluationState
      ? {
          ...defenseOption,
          nextState: defenseOption.evaluationState,
          message: defenseOption.evaluationMessage || defenseOption.message
        }
      : defenseOption;

    const evaluationNextState = applyAttackWithDefense(
      stateBeforeDefense,
      attackerId,
      evaluationDefenseOption
    );

    const candidateAttackerRef = findCardByInstanceId(
      stateBeforeDefense,
      attackerId
    );

    const candidateTargetRef = findCardByInstanceId(
      stateBeforeDefense,
      targetId
    );

    const attackerPower = getCombatPower(
      candidateAttackerRef?.card,
      candidateAttackerRef?.side
    );

    const targetPower = getCombatPower(
      candidateTargetRef?.card,
      candidateTargetRef?.side
    );

    const lifeBefore = getLifeCount(stateBeforeDefense.opponent.life);
    const lifeAfter = getLifeCount(evaluationNextState.opponent.life);

    const playerStillForcesWin = playerCanForceWin(
      evaluationNextState,
      depth + 1,
      scenario
    );

    const score = scoreDefenseChoice(evaluationNextState, evaluationDefenseOption, {
      attackerPower,
      targetPower,
      counterUsed: defenseOption.counterUsed || 0,
      lifeBefore,
      lifeAfter
    });

return {
  defenseOption,
  nextState: actualNextState,
  evaluationState: evaluationNextState,
  message: defenseOption.message,
  playerStillForcesWin,
  lifeBefore,
  lifeAfter,
  attackerPower,
  targetPower,
  score
};
  }
);

  const isLeaderAttack = targetRef.zone === "leader";

if (isLeaderAttack) {
  const highValueTakeLifeOption = evaluatedOptions.find(
    isHighValueTakeLifeOption
  );

  if (highValueTakeLifeOption) {
    return {
      nextState: highValueTakeLifeOption.nextState,
      message: highValueTakeLifeOption.message,
      playerStillForcesWin: highValueTakeLifeOption.playerStillForcesWin
    };
  }

  const dangerousTakeLifeOption = evaluatedOptions.find(
    isDangerousTakeLifeOption
  );

    if (dangerousTakeLifeOption) {
      const nonTakeOptions = evaluatedOptions.filter(
        (option) =>
          option.defenseOption.type !== "take_life" &&
          option.defenseOption.type !== "lose"
      );

      if (nonTakeOptions.length > 0) {
        const survivingNonTakeOptions = nonTakeOptions.filter(
          (option) => !option.playerStillForcesWin
        );

        const preferredNonTakeOptions =
          survivingNonTakeOptions.length > 0
            ? survivingNonTakeOptions
            : nonTakeOptions;

        const chosenNonTakeOption = chooseBestNonTakeDefense(
          preferredNonTakeOptions
        );

        if (chosenNonTakeOption) {
          return {
            nextState: chosenNonTakeOption.nextState,
            message: chosenNonTakeOption.message,
            playerStillForcesWin: chosenNonTakeOption.playerStillForcesWin
          };
        }
      }
    }

    const survivingOptions = evaluatedOptions.filter(
      (option) =>
        !option.playerStillForcesWin &&
        option.defenseOption.type !== "lose"
    );

    if (survivingOptions.length > 0) {
      const nonDangerousSurvivingOptions = survivingOptions.filter(
        (option) => !isDangerousTakeLifeOption(option)
      );

      const preferredOptions =
        nonDangerousSurvivingOptions.length > 0
          ? nonDangerousSurvivingOptions
          : survivingOptions;

     const bestLeaderBoostOption =
  chooseBestLeaderTrashBoostDefense(preferredOptions);

if (bestLeaderBoostOption) {
  return {
    nextState: bestLeaderBoostOption.nextState,
    message: bestLeaderBoostOption.message,
    playerStillForcesWin: false
  };
}

const highValueNonTakeDefense = preferredOptions.find(
  (option) =>
    option.defenseOption.type !== "take_life" &&
    option.defenseOption.type !== "lose" &&
    option.lifeBefore <= 2
);

if (highValueNonTakeDefense) {
  return {
    nextState: highValueNonTakeDefense.nextState,
    message: highValueNonTakeDefense.message,
    playerStillForcesWin: false
  };
}

const leaderBoostOption = chooseBestLeaderTrashBoostDefense(preferredOptions);

if (leaderBoostOption) {
  return {
    nextState: leaderBoostOption.nextState,
    message: leaderBoostOption.message,
    playerStillForcesWin: false
  };
}

const safeTakeLife = preferredOptions.find(
  (option) => option.defenseOption.type === "take_life"
);

if (safeTakeLife) {
  return {
    nextState: safeTakeLife.nextState,
    message: safeTakeLife.message,
    playerStillForcesWin: false
  };
}

const bestSurvivingOption = chooseHighestScoringOption(preferredOptions);

      return {
        nextState: bestSurvivingOption.nextState,
        message: bestSurvivingOption.message,
        playerStillForcesWin: false
      };
    }

    const bestLosingOption = chooseHighestScoringOption(
      evaluatedOptions.filter((option) => option.defenseOption.type !== "lose")
    );

    if (bestLosingOption) {
      return {
        nextState: bestLosingOption.nextState,
        message: bestLosingOption.message,
        playerStillForcesWin: true
      };
    }

    const loseOption = evaluatedOptions.find(
      (option) => option.defenseOption.type === "lose"
    );

    return {
      nextState: loseOption?.nextState || state,
      message:
        loseOption?.message ||
        "Opponent could not defend lethal.",
      playerStillForcesWin: true
    };
  }

  const survivingOptions = evaluatedOptions.filter(
    (option) =>
      !option.playerStillForcesWin &&
      option.defenseOption.type !== "lose"
  );

  if (survivingOptions.length > 0) {
    const bestSurvivingOption = chooseHighestScoringOption(survivingOptions);

    return {
      nextState: bestSurvivingOption.nextState,
      message: bestSurvivingOption.message,
      playerStillForcesWin: false
    };
  }

  const losingOptions = evaluatedOptions.filter(
    (option) => option.defenseOption.type !== "lose"
  );

  if (losingOptions.length > 0) {
    const bestLosingOption = chooseHighestScoringOption(losingOptions);

    return {
      nextState: bestLosingOption.nextState,
      message: bestLosingOption.message,
      playerStillForcesWin: true
    };
  }

  const loseOption = evaluatedOptions.find(
    (option) => option.defenseOption.type === "lose"
  );

  return {
    nextState: loseOption?.nextState || state,
    message: loseOption?.message || "Opponent could not defend lethal.",
    playerStillForcesWin: true
  };
}

export function resolveAttack(state, attackerId, targetId, scenario) {
  const nextState = structuredClone(state);

  const attackerRef = findCardByInstanceId(nextState, attackerId);
  const targetRef = findCardByInstanceId(nextState, targetId);

  if (!attackerRef || !targetRef) {
    return { nextState, resultMessage: "Invalid attack target." };
  }

  const attacker = attackerRef.card;
  const target = targetRef.card;

  if (attackerRef.side !== "you") {
    return { nextState, resultMessage: "You can only attack with your own cards." };
  }

  if (targetRef.side !== "opponent") {
    return { nextState, resultMessage: "You must target the opponent." };
  }

  if (!canAttack(attacker)) {
  return { nextState, resultMessage: "That card cannot attack." };
}

if (targetRef.zone === "leader" && !canAttackLeaderTarget(attacker)) {
  return {
    nextState,
    resultMessage: `${attacker.name || attacker.cardId} can only attack characters this turn.`
  };
}

if (targetRef.zone === "board" && !canAttackCharacterTarget(attacker, target)) {
  return {
    nextState,
    resultMessage: `${attacker.name || attacker.cardId} cannot attack an active character.`
  };
}

  const defenseResult = chooseBestOpponentDefense(
    nextState,
    attackerId,
    targetId,
    0,
    scenario  
  );

  return {
    nextState: defenseResult.nextState,
    resultMessage: defenseResult.message
  };
}

export function evaluateScenarioResult(state) {
  if (state.opponent?.defeated) {
    return { finished: true, result: "win", message: "You solved it." };
  }

  return { finished: false, result: null, message: "" };
}