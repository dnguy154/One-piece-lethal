export function getDisplayedPower(card, options = {}) {
  if (!card) return 0;

  const includeAttachedDon = options.includeAttachedDon ?? true;

  const basePower = Number(card.power || 0);

  const attachedDonPower =
    includeAttachedDon ? (card.attachedDon?.length || 0) * 1000 : 0;

  const tempPower = Number(card.tempPower || 0);

  // Use this for passive/static scenario-based power.
  const passivePowerBonus = Number(card.passivePowerBonus || 0);

  return basePower + attachedDonPower + tempPower + passivePowerBonus;
}

export function getCardCost(card) {
  return Number(card?.cost || 0);
}

export function isEventCard(card) {
  return String(card?.type || "").toLowerCase().includes("event");
}

export function isCharacterCard(card) {
  const type = String(card?.type || "").toLowerCase();
  return type.includes("character");
}

export function hasRush(card) {
  const effectText = String(card?.effect || "").toLowerCase();
  const rawText = String(card?.raw?.card_text || "").toLowerCase();

  return effectText.includes("rush") || rawText.includes("rush");
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
  return !!card?.isBlocker && !card?.rested;
}

export function getAvailableBlockers(board = []) {
  return board.filter((card) => canUseBlocker(card));
}