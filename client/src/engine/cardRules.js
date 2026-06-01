export function getDisplayedPower(card, options = {}) {
  if (!card) return 0;

  const includeAttachedDon = options.includeAttachedDon ?? true;

  const basePower =
    card.tempPowerOverride != null
      ? Number(card.tempPowerOverride || 0)
      : Number(card.power || card.raw?.card_power || 0) +
        Number(card.passivePowerBonus || 0) +
        (includeAttachedDon ? (card.attachedDon?.length || 0) * 1000 : 0);

  const tempPower = Number(card.tempPower || 0);

  return Math.max(0, basePower + tempPower);
}
export function hasNegatedEffects(card) {
  return !!card?.effectsNegated;
}

export function getCardCost(card) {
  if (!card) return 0;

  const baseCost = Number(card.cost ?? card.raw?.card_cost ?? 0);

  if (card.tempCostOverride != null) {
    return Math.max(0, Number(card.tempCostOverride || 0));
  }

  const tempCostDelta = Number(card.tempCostDelta || 0);

  return Math.max(0, baseCost + tempCostDelta);
}

export function isEventCard(card) {
  return String(card?.type || "").toLowerCase().includes("event");
}

export function isCharacterCard(card) {
  const type = String(card?.type || "").toLowerCase();
  return type.includes("character");
}

export function hasRush(card) {
  if (!card || hasNegatedEffects(card)) return false;

  const text = String(card.effect || card.raw?.card_text || "").toLowerCase();

  return text.includes("rush");
}

export function canAttack(card) {
  if (!card) return false;
  if (card.rested) return false;

  if (card.summoningSick && !hasRush(card)) {
    return false;
  }

  return true;
}

export function canAttackCharacterTarget(attacker, target) {
  if (!target) return false;
  if (target.rested) return true;

  return !!attacker?.canAttackActiveCharacters;
}

export function getCounterValue(card) {
  return Number(card?.counter || 0);
}

export function canUseBlocker(card) {
  if (!card) return false;
  if (hasNegatedEffects(card)) return false;

  return !!card.isBlocker;
}

export function getAvailableBlockers(board = []) {
  return board.filter((card) => canUseBlocker(card) && !card.rested);
}