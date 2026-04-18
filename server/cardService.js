const cache = new Map();

function getEndpointForCard(cardId) {
  if (cardId.startsWith("OP")) {
    return `https://optcgapi.com/api/sets/card/${cardId}/`;
  }

  if (cardId.startsWith("ST")) {
    return `https://optcgapi.com/api/decks/card/${cardId}/`;
  }

  return `https://optcgapi.com/api/sets/card/${cardId}/`;
}

function normalizeCard(raw, cardId) {
  return {
    id: raw.card_set_id || cardId,
    name: raw.card_name || cardId,
    image: raw.card_image || null,
    type: raw.card_type || null,
    cost: raw.card_cost ? Number(raw.card_cost) : null,
    power: raw.card_power ? Number(raw.card_power) : null,
    counter: raw.counter_amount ?? null,
    color: raw.card_color || null,
    attribute: raw.attribute || null,
    effect: raw.card_text || null,
    raw
  };
}

async function fetchCard(cardId) {
  if (cache.has(cardId)) {
    return cache.get(cardId);
  }

  const url = getEndpointForCard(cardId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch card ${cardId}: ${response.status}`);
  }

  const data = await response.json();
  const payload = data[0];
  const normalized = normalizeCard(payload, cardId);

  cache.set(cardId, normalized);
  return normalized;
}

async function hydrateCardRef(cardRef) {
  if (!cardRef || !cardRef.cardId) return null;

  const cardData = await fetchCard(cardRef.cardId);

  return {
    ...cardData,
    ...cardRef,
    attachedDon: cardRef.attachedDon || [],
    rested: cardRef.rested || false
  };
}

async function hydrateCardArray(cardRefs = []) {
  return Promise.all(cardRefs.map(hydrateCardRef));
}

async function hydrateScenario(scenario) {
  const hydrated = structuredClone(scenario);

  hydrated.initialState.you.hand = await hydrateCardArray(scenario.initialState.you.hand);
  hydrated.initialState.you.board = await hydrateCardArray(scenario.initialState.you.board);

  if (Array.isArray(scenario.initialState.you.life)) {
    hydrated.initialState.you.life = await hydrateCardArray(scenario.initialState.you.life);
  } else {
    hydrated.initialState.you.life = scenario.initialState.you.life;
  }
  
  hydrated.initialState.opponent.hand = await hydrateCardArray(scenario.initialState.opponent.hand);
  hydrated.initialState.opponent.board = await hydrateCardArray(scenario.initialState.opponent.board);
  
   if (Array.isArray(scenario.initialState.opponent.life)) {
    hydrated.initialState.opponent.life = await hydrateCardArray(scenario.initialState.opponent.life);
  } else {
    hydrated.initialState.opponent.life = scenario.initialState.opponent.life;
  }

  if (scenario.initialState.you.leader) {
    hydrated.initialState.you.leader = await hydrateCardRef(scenario.initialState.you.leader);
  }

  if (scenario.initialState.opponent.leader) {
    hydrated.initialState.opponent.leader = await hydrateCardRef(scenario.initialState.opponent.leader);
  }

  if (scenario.initialState.you.stage) {
    hydrated.initialState.you.stage = await hydrateCardRef(scenario.initialState.you.stage);
  }

  if (scenario.initialState.opponent.stage) {
    hydrated.initialState.opponent.stage = await hydrateCardRef(scenario.initialState.opponent.stage);
  }

  return hydrated;
}

module.exports = {
  fetchCard,
  hydrateScenario
};