import { findCardByInstanceId } from "./gameState";
import { getCardCost } from "./cardRules";

export function getAvailableUnattachedActiveDon(don = []) {
  return don.filter((donCard) => !donCard.rested && donCard.attachedTo === null);
}

export function canAffordCard(playerState, card) {
  const cost = getCardCost(card);
  const availableDon = getAvailableUnattachedActiveDon(playerState?.don || []);

  return availableDon.length >= cost;
}

export function restDonForCost(playerState, cost) {
  if (!playerState || cost <= 0) {
    return true;
  }

  const availableDon = getAvailableUnattachedActiveDon(playerState.don);

  if (availableDon.length < cost) {
    return false;
  }

  for (let i = 0; i < cost; i += 1) {
    availableDon[i].rested = true;
  }

  return true;
}

export function attachMultipleDonToTarget(state, donIds, targetId) {
  const nextState = structuredClone(state);

  const possibleTargets = [nextState.you.leader, ...nextState.you.board].filter(Boolean);
  const target = possibleTargets.find((card) => card.instanceId === targetId);

  if (!target || !Array.isArray(donIds) || donIds.length === 0) {
    return nextState;
  }

  target.attachedDon = target.attachedDon || [];

  for (const donId of donIds) {
    const donCard = nextState.you.don.find((don) => don.id === donId);

    if (!donCard || donCard.attachedTo !== null || donCard.rested) continue;

    target.attachedDon.push(donId);
    donCard.attachedTo = targetId;
  }

  return nextState;
}

export function getAvailableAttachableDonIds(state) {
  return (state.you.don || [])
    .filter((donCard) => !donCard.rested && donCard.attachedTo === null)
    .map((donCard) => donCard.id);
}

export function attachDonForSimulation(state, targetInstanceId, amount) {
  const nextState = structuredClone(state);
  const targetRef = findCardByInstanceId(nextState, targetInstanceId);

  if (!targetRef || targetRef.side !== "you") {
    return nextState;
  }

  const availableDonIds = getAvailableAttachableDonIds(nextState).slice(0, amount);

  targetRef.card.attachedDon = targetRef.card.attachedDon || [];

  for (const donId of availableDonIds) {
    const donCard = nextState.you.don.find((don) => don.id === donId);

    if (!donCard || donCard.attachedTo !== null || donCard.rested) continue;

    targetRef.card.attachedDon.push(donId);
    donCard.attachedTo = targetInstanceId;
  }

  return nextState;
}