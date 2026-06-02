export const ABILITY_TRIGGERS = {
  ON_PLAY: "on_play",
  WHEN_ATTACKING: "when_attacking",
  ACTIVATE_MAIN: "activate_main",
  ON_KO: "on_ko",
  LIFE_TRIGGER: "life_trigger"
};

function normalizeAbility(ability, fallbackTrigger = null) {
  if (!ability) return null;

  return {
    ...ability,
    trigger: ability.trigger || fallbackTrigger
  };
}

export function getCardAbilityKeys(card) {
  if (!card) return [];

  return [
    card.instanceId,
    card.cardId,
    card.id,
    card.card_set_id
  ].filter(Boolean);
}

export function getTriggeredAbilities(card, scenario, trigger) {
  if (!card || !scenario || !trigger) return [];

  const keys = getCardAbilityKeys(card);
  const abilities = [];

  const cardAbilities = scenario.cardAbilities || {};

  for (const key of keys) {
    const entry = cardAbilities[key];

    if (Array.isArray(entry)) {
      abilities.push(...entry.map((ability) => normalizeAbility(ability)));
    } else if (entry) {
      abilities.push(normalizeAbility(entry));
    }
  }

  // Backward compatibility: old event effects.
  if (trigger === ABILITY_TRIGGERS.ON_PLAY && scenario.effects) {
    for (const key of keys) {
      if (scenario.effects[key]) {
        abilities.push(normalizeAbility(scenario.effects[key], "on_play"));
      }
    }
  }

  // Backward compatibility: old Activate Main system.
  if (
    trigger === ABILITY_TRIGGERS.ACTIVATE_MAIN &&
    scenario.activateMainAbilities
  ) {
    for (const key of keys) {
      if (scenario.activateMainAbilities[key]) {
        abilities.push(
          normalizeAbility(
            scenario.activateMainAbilities[key],
            "activate_main"
          )
        );
      }
    }
  }

  return abilities.filter((ability) => ability?.trigger === trigger);
}

export function getTriggeredAbility(card, scenario, trigger) {
  return getTriggeredAbilities(card, scenario, trigger)[0] || null;
}

export function getAbilityUsageKey(ability, sourceInstanceId) {
  return (
    ability?.id ||
    `${ability?.trigger || "ability"}:${
      sourceInstanceId || ability?.sourceInstanceId || ability?.sourceCardId
    }`
  );
}

export function isAbilityUsed(state, side, ability, sourceInstanceId) {
  const usageKey = getAbilityUsageKey(ability, sourceInstanceId);

  if (!usageKey) return false;

  const usedAbilities = state?.[side]?.usedAbilities || [];

  return usedAbilities.includes(usageKey);
}

export function markAbilityUsed(state, side, ability, sourceInstanceId) {
  const usageKey = getAbilityUsageKey(ability, sourceInstanceId);

  if (!usageKey) return state;

  const currentUsed = state?.[side]?.usedAbilities || [];

  if (currentUsed.includes(usageKey)) {
    return state;
  }

  return {
    ...state,
    [side]: {
      ...state[side],
      usedAbilities: [...currentUsed, usageKey]
    }
  };
}

// Backward-compatible exports so current App.jsx does not break.
export function getActivateMainAbility(card, scenario) {
  return getTriggeredAbility(
    card,
    scenario,
    ABILITY_TRIGGERS.ACTIVATE_MAIN
  );
}

export function isActivateMainAbilityUsed(
  state,
  side,
  ability,
  sourceInstanceId
) {
  return isAbilityUsed(state, side, ability, sourceInstanceId);
}

export function markActivateMainAbilityUsed(
  state,
  side,
  ability,
  sourceInstanceId
) {
  return markAbilityUsed(state, side, ability, sourceInstanceId);
}