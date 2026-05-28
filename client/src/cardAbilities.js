export function getActivateMainAbility(card, scenario) {
  if (!card || !scenario) return null;

  const abilities =
    scenario.activateMainAbilities ||
    scenario.abilities ||
    {};

  const possibleKeys = [
    card.instanceId,
    card.cardId,
    card.id,
    card.card_set_id
  ].filter(Boolean);

  for (const key of possibleKeys) {
    if (abilities[key]) {
      return abilities[key];
    }
  }

  return null;
}

export function getActivateMainUsageKey(ability, sourceInstanceId) {
  return ability?.id || sourceInstanceId;
}

export function isActivateMainAbilityUsed(state, side, ability, sourceInstanceId) {
  const usageKey = getActivateMainUsageKey(ability, sourceInstanceId);

  if (!usageKey) return false;

  const usedAbilities = state?.[side]?.usedActivateMainAbilities || [];

  return usedAbilities.includes(usageKey);
}

export function markActivateMainAbilityUsed(state, side, ability, sourceInstanceId) {
  const usageKey = getActivateMainUsageKey(ability, sourceInstanceId);

  if (!usageKey) return state;

  const currentUsed = state?.[side]?.usedActivateMainAbilities || [];

  if (currentUsed.includes(usageKey)) {
    return state;
  }

  return {
    ...state,
    [side]: {
      ...state[side],
      usedActivateMainAbilities: [...currentUsed, usageKey]
    }
  };
}