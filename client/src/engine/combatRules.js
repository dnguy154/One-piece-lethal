import {
  getDisplayedPower,
  canAttack,
  canAttackCharacterTarget,
  getCounterValue,
  canUseBlocker,
  getAvailableBlockers
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

      if (attackState.opponent.leader?.instanceId) {
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

function createTakeLifeDefenseOption(state) {
  const nextState = structuredClone(state);

  if (getLifeCount(nextState.opponent.life) > 0) {
    takeTopLifeToHand(nextState.opponent);

    return {
      nextState,
      message: "Opponent took 1 life into hand.",
      type: "take_life"
    };
  }

  nextState.opponent.defeated = true;

  return {
    nextState,
    message: "Opponent could not defend lethal.",
    type: "lose"
  };
}

function createBlockDefenseOptions(state, attackerPower) {
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

      const targetPower = getCombatPower(counterBlockerRef.card, counterBlockerRef.side);
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

function generateDefenseOptions(state, attackerId, targetId) {
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
    options.push(createTakeLifeDefenseOption(state));

    const blockOptions = createBlockDefenseOptions(state, attackerPower);
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

function playerCanForceWin(state, depth = 0) {
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
      depth
    );

    if (defenseResult.playerStillForcesWin) {
      return true;
    }
  }

  return false;
}

function chooseBestOpponentDefense(state, attackerId, targetId, depth = 0) {
  const defenseOptions = generateDefenseOptions(state, attackerId, targetId);

  const attackerRef = findCardByInstanceId(state, attackerId);
  const targetRef = findCardByInstanceId(state, targetId);

const attackerPower = getCombatPower(attackerRef?.card, attackerRef?.side);
const targetPower = getCombatPower(targetRef?.card, targetRef?.side);

  const scoreContext = {
    attackerPower,
    targetPower,
    lifeBefore: getLifeCount(state.opponent.life)
  };

  if (targetRef?.zone === "leader") {
    const opponentLifeNow = getLifeCount(state.opponent.life);
    const counterNeededForAttack = Math.max(0, attackerPower - targetPower + 1000);

    const LIFE_PRESERVE_COUNTER_LIMIT = opponentLifeNow <= 1 ? 5000 : 4000;

    const counterOption = defenseOptions.find(
      (option) => option.type === "counter"
    );

    if (
      counterOption &&
      opponentLifeNow <= 2 &&
      counterNeededForAttack > 0 &&
      counterNeededForAttack <= LIFE_PRESERVE_COUNTER_LIMIT
    ) {
      const counterState = applyAttackWithDefense(
        state,
        attackerId,
        counterOption
      );

      return {
        nextState: counterState,
        message: counterOption.message,
        playerStillForcesWin: false
      };
    }
  }

  if (targetRef?.zone === "leader" && getLifeCount(state.opponent.life) === 0) {
    const counterOption = defenseOptions.find(
      (option) => option.type === "counter"
    );

    if (counterOption) {
      const counterState = applyAttackWithDefense(
        state,
        attackerId,
        counterOption
      );

      return {
        nextState: counterState,
        message: counterOption.message,
        playerStillForcesWin: false
      };
    }
  }

  if (defenseOptions.length === 0) {
    return {
      nextState: state,
      message: "No legal defense found.",
      playerStillForcesWin: false
    };
  }

  const isLeaderAttack = targetRef?.zone === "leader";
  const opponentLife = getLifeCount(state.opponent.life);
  const opponentHasBlocker = getAvailableBlockers(state.opponent.board).length > 0;

  const neededCounter = Math.max(0, attackerPower - targetPower + 1000);

  const availableCounter = (state.opponent.hand || []).reduce(
    (total, card) => total + getCounterValue(card),
    0
  );

  if (isLeaderAttack && opponentLife > 0) {
    const isSmallSwing = neededCounter > 0 && neededCounter <= 2000;
    const canCounterSmallSwing = availableCounter >= neededCounter;

    const shouldAvoidTakingLife =
      opponentLife <= 1 &&
      opponentHasBlocker &&
      isSmallSwing &&
      canCounterSmallSwing;

    if (!shouldAvoidTakingLife) {
      const takeLifeOption = defenseOptions.find(
        (option) => option.type === "take_life"
      );

      if (takeLifeOption) {
        const takeLifeState = applyAttackWithDefense(
          state,
          attackerId,
          takeLifeOption
        );

        const playerStillForcesWinAfterTaking = playerCanForceWin(
          takeLifeState,
          depth + 1
        );

        if (!playerStillForcesWinAfterTaking) {
          return {
            nextState: takeLifeState,
            message: takeLifeOption.message,
            playerStillForcesWin: false
          };
        }
      }
    }
  }

  let bestLosingOption = null;
  let bestLosingScore = -Infinity;

  let bestSurvivingOption = null;
  let bestSurvivingScore = -Infinity;

  if (isLeaderAttack && opponentLife > 0) {
    const takeLifeOption = defenseOptions.find(
      (option) => option.type === "take_life"
    );

    if (takeLifeOption) {
      const takeLifeState = applyAttackWithDefense(
        state,
        attackerId,
        takeLifeOption
      );

      const takingLifeStillLoses = playerCanForceWin(
        takeLifeState,
        depth + 1
      );

      if (!takingLifeStillLoses) {
        return {
          nextState: takeLifeState,
          message: takeLifeOption.message,
          playerStillForcesWin: false
        };
      }
    }
  }

  for (const defenseOption of defenseOptions) {
    const nextState = applyAttackWithDefense(state, attackerId, defenseOption);
    const playerStillForcesWin = playerCanForceWin(nextState, depth + 1);

    if (!playerStillForcesWin) {
      const score = scoreDefenseChoice(nextState, defenseOption, scoreContext);

      if (score > bestSurvivingScore) {
        bestSurvivingScore = score;
        bestSurvivingOption = {
          nextState,
          message: defenseOption.message,
          playerStillForcesWin: false
        };
      }

      continue;
    }

    const losingScore = scoreDefenseChoice(nextState, defenseOption, scoreContext);

    if (losingScore > bestLosingScore) {
      bestLosingScore = losingScore;
      bestLosingOption = {
        nextState,
        message: defenseOption.message,
        playerStillForcesWin: true
      };
    }
  }

  return bestSurvivingOption || bestLosingOption;
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

  if (targetRef.zone === "board" && !canAttackCharacterTarget(attacker, target)) {
    return {
      nextState,
      resultMessage: `${attacker.name} cannot attack an active character.`
    };
  }

  const defenseResult = chooseBestOpponentDefense(
    nextState,
    attackerId,
    targetId,
    0
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