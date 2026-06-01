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

function isDangerousTakeLifeOption(evaluatedOption) {
  if (evaluatedOption.defenseOption.type !== "take_life") {
    return false;
  }

  // If taking life still survives all future leader attacks,
  // then it is not dangerous. It is usually the correct punish.
  if (!evaluatedOption.playerStillForcesWin) {
    return false;
  }

  const lifeAfter = getLifeCount(evaluatedOption.nextState.opponent.life);
  const remainingAttackers = getFutureAttackers(evaluatedOption.nextState).length;

  return lifeAfter === 0 && remainingAttackers > 0;
}

function chooseHighestScoringOption(options) {
  return [...options].sort((a, b) => b.score - a.score)[0] || null;
}

function chooseBestNonTakeDefense(options) {
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

  const blockOptions = options.filter((option) =>
    option.defenseOption.type.startsWith("block")
  );

  if (blockOptions.length > 0) {
    return chooseHighestScoringOption(blockOptions);
  }

  return chooseHighestScoringOption(options);
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
    targetId
  ).filter(isLeaderBoostDefenseOption);

  return boostedDefenseOptions.map((defenseOption) => ({
    stateBeforeDefense: boostedState,
    defenseOption: {
      ...defenseOption,
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
    targetId
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
      const nextState = applyAttackWithDefense(
        stateBeforeDefense,
        attackerId,
        defenseOption
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
      const lifeAfter = getLifeCount(nextState.opponent.life);

      const playerStillForcesWin = playerCanForceWin(
        nextState,
        depth + 1,
        scenario
      );

      const score = scoreDefenseChoice(nextState, defenseOption, {
        attackerPower,
        targetPower,
        counterUsed: defenseOption.counterUsed || 0,
        lifeBefore,
        lifeAfter
      });

      return {
        defenseOption,
        nextState,
        message: defenseOption.message,
        playerStillForcesWin,
        lifeBefore,
        lifeAfter,
        score
      };
    }
  );

  const isLeaderAttack = targetRef.zone === "leader";

  if (isLeaderAttack) {
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