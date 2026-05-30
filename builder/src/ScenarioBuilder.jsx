import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const DON_IMAGE =
  "https://www.optcgapi.com/media/static/Card_Images/DON_Card__Green_Compass_-_Starter_Deck_1_Straw_Hat_Crew_ST-01_img.jpg";

const EMPTY_SCENARIO = {
  id: 1,
  title: "Find Lethal #",
  difficulty: "Medium",
  goal: {
    type: "win_this_turn"
  },
  opponentAI: {
    counterFromHand: {
      enabled: true,
      allowedZones: ["leader", "board"],
      strategy: "minimum_to_survive"
    },
    blocker: {
      enabled: true,
      onlyWhenLethal: true
    }
  },
  initialState: {
    you: {
      life: [],
      don: [],
      leader: null,
      hand: [],
      deck: [],
      board: [],
      stage: null,
      trash: [],
      deckCount: 40,
      trashCount: 0
    },
    opponent: {
      life: [],
      don: [],
      leader: null,
      hand: [],
      deck: [],
      board: [],
      stage: null,
      trash: [],
      deckCount: 40,
      trashCount: 0
    }
  },

  effects: {},
  activateMainAbilities: {},
  cardAbilities: {},

  steps: [
    {
      id: "start",
      prompt: "Solve the scenario",
      options: []
    },
    {
      id: "win",
      prompt: "You win",
      options: [],
      result: "win"
    },
    {
      id: "fail",
      prompt: "Incorrect line",
      options: [],
      result: "fail"
    }
  ]
};

function CardTile({
  card,
  hidden = false,
  variant = "board",
  powerValue,
  attachedDonCount = 0
}) {
  const className = `card-tile ${variant} ${card?.rested ? "rested" : ""}`;

  if (hidden) return <div className={`${className} card-back`} />;
  if (!card) return <div className={`${className} card-empty`} />;

  return (
    <div className={className}>
      <img src={card.image} alt={card.name} className="card-image" />
      {powerValue ? <div className="power-badge">{powerValue}</div> : null}
      {attachedDonCount > 0 ? (
        <div className="attached-don-badge">+{attachedDonCount} DON</div>
      ) : null}
    </div>
  );
}

function DonCard({ rested = false, small = true }) {
  return (
    <div className={`don-card ${small ? "small" : ""} ${rested ? "rested" : ""}`}>
      <img src={DON_IMAGE} alt="DON!! card" className="don-image" />
    </div>
  );
}

function DonArea({ don }) {
  const donCards = Array.isArray(don)
    ? don.filter((donCard) => donCard.attachedTo === null)
    : [];

  return (
    <div className="don-area">
      {donCards.map((donCard, index) => (
        <div
          key={donCard.id ?? index}
          className={`don-stack-item ${donCard.rested ? "disabled-don" : ""}`}
          style={{
            left: `calc(15px + ${index} * min(25px, (100% - var(--don-card-w) - 12px) / 9))`,
            zIndex: index + 1
          }}
        >
          <DonCard rested={!!donCard.rested} small />
        </div>
      ))}
    </div>
  );
}

function LifeStack({ lifeCards }) {
  const count = Array.isArray(lifeCards) ? lifeCards.length : Number(lifeCards) || 0;
  const cards = Array.from({ length: count });

  return (
    <div className="life-stack">
      {cards.map((_, index) => (
        <div
          key={index}
          className="life-card"
          style={{
            top: `${index * 20}px`,
            zIndex: index + 1
          }}
        >
          <img src="/images/card_back.png" className="life-card-inner" alt="Life card" />
        </div>
      ))}
    </div>
  );
}

function Zone({ title, children, className = "" }) {
  return (
    <div className={`zone ${className}`}>
      <div className="zone-title">{title}</div>
      <div className="zone-body">{children}</div>
    </div>
  );
}

function getDisplayedPower(card) {
  const basePower = Number(card?.power || 0);
  const donBonus = (card?.attachedDon?.length || 0) * 1000;
  const passivePowerBonus = Number(card?.passivePowerBonus || 0);

  return basePower + donBonus + passivePowerBonus;
}

function CharacterCards({ cards = [] }) {
  const slots = Array.from({ length: 5 }, (_, index) => cards[index] || null);

  return (
    <div className="character-cards">
      {slots.map((card, index) => (
        <div key={card?.instanceId || `slot-${index}`} className="character-slot">
          <CardTile
            card={card}
            variant="board"
            powerValue={card ? getDisplayedPower(card) : undefined}
            attachedDonCount={card?.attachedDon?.length || 0}
          />
        </div>
      ))}
    </div>
  );
}

function HandColumn({ cards }) {
  return (
    <div className="hand-column">
      <div className="hand-strip side-hand-horizontal">
        {cards?.map((card, index) => (
          <CardTile
            key={`${card.instanceId || card.id || card.name}-${index}`}
            card={card}
            variant="hand"
          />
        ))}
      </div>
    </div>
  );
}

function PreviewBoard({ data, isOpponent = false }) {
  return (
    <div className={`board-area ${isOpponent ? "opponent-board" : "player-board"}`}>
      <div className="board-body side-hand-layout">
        <HandColumn cards={data.hand} />

        <div className="life-column">
          <LifeStack lifeCards={data.life} />
        </div>

        <div className={`playmat compact-playmat ${isOpponent ? "opponent-flipped" : ""}`}>
          {isOpponent ? (
            <>
              <div className="resource-split-row compact-resource-row">
                <Zone title="DON!! Area" className="don-zone compact-zone">
                  <DonArea don={data.don} />
                </Zone>

                <Zone title="Trash" className="trash-zone compact-zone">
                  <div className="stack-card trash-box">{data.trashCount ?? 0}</div>
                </Zone>
              </div>

              <div className="mid-row opponent-mid-row compact-mid-row">
                <Zone title="Leader" className="leader-zone compact-zone">
                  <CardTile
                    card={data.leader || null}
                    variant="leader"
                    powerValue={getDisplayedPower(data.leader)}
                    attachedDonCount={data.leader?.attachedDon?.length || 0}
                  />
                </Zone>

                <Zone title="Stage" className="stage-zone compact-zone">
                  <CardTile card={data.stage || null} variant="stage" />
                </Zone>

                <Zone title="Deck" className="deck-zone compact-zone">
                  <div className="deck-stack">
                    <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                    <div className="deck-count">{data.deckCount ?? 40}</div>
                  </div>
                </Zone>
              </div>

              <Zone title="Character Area" className="character-zone">
                <CharacterCards cards={data.board} />
              </Zone>
            </>
          ) : (
            <>
              <Zone title="Character Area" className="character-zone">
                <CharacterCards cards={data.board} />
              </Zone>

              <div className="mid-row player-mid-row compact-mid-row">
                <Zone title="Leader" className="leader-zone compact-zone">
                  <CardTile
                    card={data.leader || null}
                    variant="leader"
                    powerValue={getDisplayedPower(data.leader)}
                    attachedDonCount={data.leader?.attachedDon?.length || 0}
                  />
                </Zone>

                <Zone title="Stage" className="stage-zone compact-zone">
                  <CardTile card={data.stage || null} variant="stage" />
                </Zone>

                <Zone title="Deck" className="deck-zone compact-zone">
                  <div className="deck-stack">
                    <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                    <div className="deck-count">{data.deckCount ?? 40}</div>
                  </div>
                </Zone>
              </div>

              <div className="resource-split-row compact-resource-row">
                <Zone title="DON!! Area" className="don-zone compact-zone">
                  <DonArea don={data.don} />
                </Zone>

                <Zone title="Trash" className="trash-zone compact-zone">
                  <div className="stack-card trash-box">{data.trashCount ?? 0}</div>
                </Zone>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioPreview({ scenario }) {
  return (
    <div className="builder-preview">
      <PreviewBoard data={scenario.initialState.opponent} isOpponent />
      <PreviewBoard data={scenario.initialState.you} />
    </div>
  );
}

function hydrateCardRef(cardData, cardRef) {
  return {
    ...cardData,
    ...cardRef,
    attachedDon: cardRef.attachedDon || [],
    rested: cardRef.rested || false
  };
}
function normalizeTraits(traits) {
  if (Array.isArray(traits)) {
    return traits.map((trait) => String(trait).trim()).filter(Boolean);
  }

  if (typeof traits === "string") {
    return traits
      .split(",")
      .map((trait) => trait.trim())
      .filter(Boolean);
  }

  return [];
}

function makeBoardInstance(cardData, side, index) {
  return {
    ...cardData,
    cardId: cardData.id,
    instanceId: `${side}-board-${index + 1}`,
    attachedDon: [],
    rested: false,
    isBlocker: false,
    summoningSick: false,
    passivePowerBonus: 0,
    traits: normalizeTraits(cardData.traits || cardData.raw?.card_traits)
  };
}

function makeLeaderInstance(cardData, side) {
  return {
    ...cardData,
    cardId: cardData.id,
    instanceId: `${side}-leader`,
    attachedDon: [],
    rested: false,
    passivePowerBonus: 0,
    traits: normalizeTraits(cardData.traits || cardData.raw?.card_traits)
  };
}

function makeHandCard(cardData) {
  return {
    ...cardData,
    cardId: cardData.id
  };
}

function makeLifeCard(cardData, side, index) {
  return {
    ...cardData,
    cardId: cardData.id,
    instanceId: `${side}-life-${index + 1}`,
    traits: normalizeTraits(cardData.traits || cardData.raw?.card_traits)
  };
}

function buildDonArray(count) {
  return Array.from({ length: Number(count) || 0 }, (_, index) => ({
    id: index + 1,
    rested: false,
    attachedTo: null
  }));
}

function BuilderListCard({ title, children }) {
  return (
    <div className="builder-list-card">
      <div className="builder-list-card-title">{title}</div>
      <div className="builder-list-card-actions">{children}</div>
    </div>
  );
}


export default function ScenarioBuilder() {
  const [scenario, setScenario] = useState(EMPTY_SCENARIO);
  const [searchId, setSearchId] = useState("");
  const [cardResult, setCardResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportText, setExportText] = useState("");
  const [effectCardId, setEffectCardId] = useState("");
  const [abilitySourceKey, setAbilitySourceKey] = useState("");
  const [abilityTrigger, setAbilityTrigger] = useState("on_play");
  const [abilityName, setAbilityName] = useState("Scenario Ability");
  const [activateRequiredAttachedDon, setActivateRequiredAttachedDon] = useState(0);
  const [playFromLifeExactCost, setPlayFromLifeExactCost] = useState(5);
  const [playFromLifeTraitsText, setPlayFromLifeTraitsText] = useState("Supernovas");
  const [abilityOncePerTurn, setAbilityOncePerTurn] = useState(false);
  const [abilityStepPlacement, setAbilityStepPlacement] = useState("steps");
  const [abilityRestandDonCount, setAbilityRestandDonCount] = useState(3);
  const [drawCardIdsText, setDrawCardIdsText] = useState("");
  const [reducePowerAmount, setReducePowerAmount] = useState(4000);
  const [koMaxPower, setKoMaxPower] = useState(0);
  const [buffPowerAmount, setBuffPowerAmount] = useState(2000);
  const [effectStepOptional, setEffectStepOptional] = useState(false);

  const [eventAdditionalRestDon, setEventAdditionalRestDon] = useState(0);

  const [restTargetSide, setRestTargetSide] = useState("opponent");
  const [restTargetZones, setRestTargetZones] = useState({
    leader: false,
    board: true,
    stage: false,
    don: true
  });

  const [activateSourceInstanceId, setActivateSourceInstanceId] =
    useState("you-leader");
  const [activateAbilityName, setActivateAbilityName] =
    useState("Rest 1 card to restand DON");
  const [activateOncePerTurn, setActivateOncePerTurn] = useState(true);
  const [activateRestandDonCount, setActivateRestandDonCount] = useState(3);
  const [activateRestCostSide, setActivateRestCostSide] = useState("you");
  const [activateRestCostZones, setActivateRestCostZones] = useState({
    leader: true,
    board: true,
    stage: true,
    don: true
  });

  const updateScenarioMeta = (field, value) => {
    setScenario((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePlayerField = (side, field, value) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          [field]: value
        }
      }
    }));
  };

  const fetchCard = async () => {
    if (!searchId.trim()) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/card/${searchId.trim()}`)
      setCardResult(res.data);
    } catch (error) {
      console.error(error);
      setCardResult(null);
      alert("Failed to fetch card.");
    } finally {
      setLoading(false);
    }
  };

  const addLeader = (side) => {
    if (!cardResult) return;
    updatePlayerField(side, "leader", makeLeaderInstance(cardResult, side));
  };

  const clearLeader = (side) => {
    updatePlayerField(side, "leader", null);
  };

  const addToHand = (side) => {
    if (!cardResult) return;

    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          hand: [...prev.initialState[side].hand, makeHandCard(cardResult)]
        }
      }
    }));
  };

  const removeFromHand = (side, index) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          hand: prev.initialState[side].hand.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const addToDeck = (side) => {
    if (!cardResult) return;

    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          deck: [...(prev.initialState[side].deck || []), makeHandCard(cardResult)]
        }
      }
    }));
  };

  const removeFromDeck = (side, index) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          deck: (prev.initialState[side].deck || []).filter((_, i) => i !== index)
        }
      }
    }));
  };

  const addToTrash = (side) => {
    if (!cardResult) return;

    setScenario((prev) => {
      const currentTrash = prev.initialState[side].trash || [];

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...prev.initialState[side],
            trash: [...currentTrash, makeHandCard(cardResult)],
            trashCount: currentTrash.length + 1
          }
        }
      };
    });
  };

  const removeFromTrash = (side, index) => {
    setScenario((prev) => {
      const nextTrash = (prev.initialState[side].trash || []).filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...prev.initialState[side],
            trash: nextTrash,
            trashCount: nextTrash.length
          }
        }
      };
    });
  };

  const addToBoard = (side) => {
    if (!cardResult) return;

    setScenario((prev) => {
      const currentBoard = prev.initialState[side].board;

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...prev.initialState[side],
            board: [...currentBoard, makeBoardInstance(cardResult, side, currentBoard.length)]
          }
        }
      };
    });
  };

  const removeBoardCard = (side, index) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          board: prev.initialState[side].board.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const toggleBoardField = (side, index, field) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          board: prev.initialState[side].board.map((card, i) =>
            i === index ? { ...card, [field]: !card[field] } : card
          )
        }
      }
    }));
  };

  const toggleDonRested = (side, donId) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          don: prev.initialState[side].don.map((donCard) =>
            donCard.id === donId
              ? { ...donCard, rested: !donCard.rested }
              : donCard
          )
        }
      }
    }));
  };

  const attachDonToTargetInBuilder = (side, donId, targetInstanceId) => {
    setScenario((prev) => {
      const currentSide = prev.initialState[side];

      const nextDon = currentSide.don.map((donCard) =>
        donCard.id === donId
          ? {
            ...donCard,
            attachedTo:
              donCard.attachedTo === targetInstanceId ? null : targetInstanceId
          }
          : donCard
      );

      const nextLeader =
        currentSide.leader?.instanceId === targetInstanceId
          ? {
            ...currentSide.leader,
            attachedDon: currentSide.leader.attachedDon?.includes(donId)
              ? currentSide.leader.attachedDon.filter((id) => id !== donId)
              : [...(currentSide.leader.attachedDon || []), donId]
          }
          : currentSide.leader;

      const nextBoard = currentSide.board.map((card) => {
        if (card.instanceId !== targetInstanceId) return card;

        return {
          ...card,
          attachedDon: card.attachedDon?.includes(donId)
            ? card.attachedDon.filter((id) => id !== donId)
            : [...(card.attachedDon || []), donId]
        };
      });

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...currentSide,
            don: nextDon,
            leader: nextLeader,
            board: nextBoard
          }
        }
      };
    });
  };

  const clearDonAttachmentInBuilder = (side, donId) => {
    setScenario((prev) => {
      const currentSide = prev.initialState[side];

      const nextDon = currentSide.don.map((donCard) =>
        donCard.id === donId
          ? { ...donCard, attachedTo: null }
          : donCard
      );

      const nextLeader = currentSide.leader
        ? {
          ...currentSide.leader,
          attachedDon: (currentSide.leader.attachedDon || []).filter(
            (id) => id !== donId
          )
        }
        : null;

      const nextBoard = currentSide.board.map((card) => ({
        ...card,
        attachedDon: (card.attachedDon || []).filter((id) => id !== donId)
      }));

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...currentSide,
            don: nextDon,
            leader: nextLeader,
            board: nextBoard
          }
        }
      };
    });
  };

  const addToLife = (side) => {
    if (!cardResult) return;

    setScenario((prev) => {
      const currentLife = Array.isArray(prev.initialState[side].life)
        ? prev.initialState[side].life
        : [];

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...prev.initialState[side],
            life: [...currentLife, makeLifeCard(cardResult, side, currentLife.length)]
          }
        }
      };
    });
  };

  const removeFromLife = (side, index) => {
    setScenario((prev) => ({
      ...prev,
      initialState: {
        ...prev.initialState,
        [side]: {
          ...prev.initialState[side],
          life: prev.initialState[side].life.filter((_, i) => i !== index)
        }
      }
    }));
  };

const clearStage = (side) => {
  updatePlayerField(side, "stage", null);
};

const setStage = (side) => {
  if (!cardResult) return;

  const stageRef = {
    ...cardResult,
    cardId: cardResult.id,
    instanceId: `${side}-stage`,
    attachedDon: [],
    rested: false,
    passivePowerBonus: 0,
    traits: normalizeTraits(cardResult.traits || cardResult.raw?.card_traits)
  };

  updatePlayerField(side, "stage", stageRef);
};

  const setGoalType = (value) => {
    setScenario((prev) => ({
      ...prev,
      goal: {
        ...prev.goal,
        type: value
      }
    }));
  };

  const ensureScenarioEffect = (sourceCardId) => {
    if (!sourceCardId) return null;

    const existingEffect = scenario.effects?.[sourceCardId];

    if (existingEffect) {
      return existingEffect;
    }

    return {
      id: sourceCardId,
      name: "Scenario Effect",
      steps: []
    };
  };

  const upsertScenarioEffect = (cardId, effectData) => {
    if (!cardId) return;

    setScenario((prev) => ({
      ...prev,
      effects: {
        ...(prev.effects || {}),
        [cardId]: effectData
      }
    }));
  };

  const removeScenarioEffect = (cardId) => {
    setScenario((prev) => {
      const nextEffects = { ...(prev.effects || {}) };
      delete nextEffects[cardId];

      return {
        ...prev,
        effects: nextEffects
      };
    });
  };

  const getSelectedZones = (zoneState) => {
    return Object.entries(zoneState)
      .filter(([, enabled]) => enabled)
      .map(([zone]) => zone);
  };

  const toggleZone = (setter, zone) => {
    setter((prev) => ({
      ...prev,
      [zone]: !prev[zone]
    }));
  };

  const updateCardByInstanceId = (side, instanceId, patch) => {
    if (!side || !instanceId) return;

    setScenario((prev) => {
      const sideData = prev.initialState[side];

      const updateCard = (card) => {
        if (!card || card.instanceId !== instanceId) return card;

        return {
          ...card,
          ...patch
        };
      };

      return {
        ...prev,
        initialState: {
          ...prev.initialState,
          [side]: {
            ...sideData,
            leader: updateCard(sideData.leader),
            stage: updateCard(sideData.stage),
            board: (sideData.board || []).map(updateCard),
            life: Array.isArray(sideData.life)
              ? sideData.life.map(updateCard)
              : sideData.life
          }
        }
      };
    });
  };

  const renderPassivePowerInput = (side, card) => {
    if (!card?.instanceId) return null;

    return (
      <>
        <label>Passive Power Bonus</label>
        <input
          type="number"
          value={Number(card.passivePowerBonus || 0)}
          onChange={(event) =>
            updateCardByInstanceId(side, card.instanceId, {
              passivePowerBonus: Number(event.target.value) || 0
            })
          }
        />
      </>
    );
  };


  const traitsToText = (traits) => {
    return normalizeTraits(traits).join(", ");
  };

  const renderTraitsInput = (side, card) => {
    if (!card?.instanceId) return null;

    return (
      <>
        <label>Traits</label>
        <input
          value={traitsToText(card.traits)}
          onChange={(event) =>
            updateCardByInstanceId(side, card.instanceId, {
              traits: normalizeTraits(event.target.value)
            })
          }
          placeholder="Supernovas, Straw Hat Crew"
        />
      </>
    );
  };

  const ABILITY_TRIGGER_OPTIONS = [
    { value: "on_play", label: "On Play" },
    { value: "when_attacking", label: "When Attacking" },
    { value: "activate_main", label: "Activate: Main" },
    { value: "on_ko", label: "On KO" }
  ];

const normalizeAbilityArray = (entry) => {
  if (!entry) return [];

  const array = Array.isArray(entry) ? entry : [entry];

  return array.filter((ability) => ability && typeof ability === "object");
};

  const makeAbilityId = (sourceKey, trigger) => {
    const safeSource = String(sourceKey || "card")
      .replace(/[^A-Za-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return `${safeSource || "card"}_${trigger || "ability"}`;
  };

  const getCurrentAbility = () => {
    const sourceKey = abilitySourceKey.trim();

    if (!sourceKey) return null;

    return normalizeAbilityArray(scenario.cardAbilities?.[sourceKey]).find(
      (ability) => ability.trigger === abilityTrigger
    ) || null;
  };

  const upsertCardAbility = (sourceKey, abilityData) => {
    if (!sourceKey || !abilityData) return;

    setScenario((prev) => {
      const existingList = normalizeAbilityArray(prev.cardAbilities?.[sourceKey]);
      const abilityId = abilityData.id || makeAbilityId(sourceKey, abilityData.trigger);
      const nextAbility = {
        ...abilityData,
        id: abilityId
      };

      const hasExisting = existingList.some((ability) => ability.id === abilityId);
      const nextList = hasExisting
        ? existingList.map((ability) =>
          ability.id === abilityId ? nextAbility : ability
        )
        : [...existingList, nextAbility];

      return {
        ...prev,
        cardAbilities: {
          ...(prev.cardAbilities || {}),
          [sourceKey]: nextList
        }
      };
    });
  };

  const createOrUpdateCurrentAbility = () => {
    const sourceKey = abilitySourceKey.trim();

    if (!sourceKey) {
      alert("Enter a source card ID or instance ID.");
      return null;
    }

    const existingAbility = getCurrentAbility();
    const additionalRestDon = Math.max(0, Number(eventAdditionalRestDon || 0));
    const requiredAttachedDon = Math.max(
      0,
      Number(activateRequiredAttachedDon || 0)
    );

    const nextAbility = {
      ...(existingAbility || {}),
      id: existingAbility?.id || makeAbilityId(sourceKey, abilityTrigger),
      trigger: abilityTrigger,
      name: abilityName || "Scenario Ability",
      steps: existingAbility?.steps || []
    };

    if (abilityTrigger === "activate_main") {
      nextAbility.sourceInstanceId = sourceKey;
      nextAbility.oncePerTurn = abilityOncePerTurn;
      nextAbility.costSteps = existingAbility?.costSteps || [];

      const nextRequirements = {
        ...(existingAbility?.requirements || {})
      };

      if (requiredAttachedDon > 0) {
        nextRequirements.sourceAttachedDon = requiredAttachedDon;
      } else {
        delete nextRequirements.sourceAttachedDon;
      }

      if (Object.keys(nextRequirements).length > 0) {
        nextAbility.requirements = nextRequirements;
      } else {
        delete nextAbility.requirements;
      }
    } else if (abilityOncePerTurn) {
      nextAbility.oncePerTurn = true;
      delete nextAbility.requirements;
    } else {
      delete nextAbility.oncePerTurn;
      delete nextAbility.requirements;
    }

    // Only On Play abilities should use "rest extra DON" as an additional cost.
    if (abilityTrigger === "on_play" && additionalRestDon > 0) {
      nextAbility.additionalCost = {
        ...(existingAbility?.additionalCost || {}),
        restDon: additionalRestDon
      };
    } else if (nextAbility.additionalCost?.restDon) {
      const nextAdditionalCost = { ...nextAbility.additionalCost };
      delete nextAdditionalCost.restDon;

      if (Object.keys(nextAdditionalCost).length > 0) {
        nextAbility.additionalCost = nextAdditionalCost;
      } else {
        delete nextAbility.additionalCost;
      }
    }

    upsertCardAbility(sourceKey, nextAbility);
    return nextAbility;
  };

  const addAbilityReturnTargetToHandStep = () => {
    const zones = getSelectedZones(restTargetZones);

    if (zones.length === 0) {
      alert("Choose at least one valid target zone.");
      return;
    }

    addAbilityStep(
      {
        id: `return_target_to_hand_${Date.now()}`,
        type: "return_target_to_hand",
        optional: effectStepOptional,
        prompt: `Choose ${restTargetSide === "opponent" ? "an opponent" : "your"
          } ${zones.join(" or ")} to return to hand${effectStepOptional ? ", or skip this optional effect." : "."
          }`,
        targetRules: {
          sides: [restTargetSide],
          zones
        }
      },
      abilityStepPlacement
    );
  };

  const addAbilityPlayTopLifeIfStep = () => {
    const exactCost = Number(playFromLifeExactCost);

    if (!Number.isFinite(exactCost) || exactCost < 0) {
      alert("Enter a valid exact cost.");
      return;
    }

    const requiredTraits = playFromLifeTraitsText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    addAbilityStep({
      id: `play_top_life_if_${Date.now()}`,
      type: "play_top_life_if",
      player: "you",
      exactCost,
      requiredCardType: "character",
      requiredTraits,
      failMessage: `Top life is not a ${exactCost}-cost ${requiredTraits.join(
        " / "
      )} character.`
    });
  };

  const addAbilityStep = (step, placement = "steps") => {
    const sourceKey = abilitySourceKey.trim();

    if (!sourceKey) {
      alert("Enter a source card ID or instance ID.");
      return;
    }

    const ability = createOrUpdateCurrentAbility();

    if (!ability) return;

    const stepKey = placement === "costSteps" ? "costSteps" : "steps";
    const nextAbility = {
      ...ability,
      [stepKey]: [...(ability[stepKey] || []), step]
    };

    upsertCardAbility(sourceKey, nextAbility);
  };

  const removeCardAbility = (sourceKey, abilityId) => {
    setScenario((prev) => {
      const existingList = normalizeAbilityArray(prev.cardAbilities?.[sourceKey]);
      const nextList = existingList.filter((ability) => ability.id !== abilityId);
      const nextCardAbilities = { ...(prev.cardAbilities || {}) };

      if (nextList.length > 0) {
        nextCardAbilities[sourceKey] = nextList;
      } else {
        delete nextCardAbilities[sourceKey];
      }

      return {
        ...prev,
        cardAbilities: nextCardAbilities
      };
    });
  };

  const removeAbilityStep = (sourceKey, abilityId, stepKey, stepIndex) => {
    setScenario((prev) => {
      const existingList = normalizeAbilityArray(prev.cardAbilities?.[sourceKey]);
      const nextList = existingList.map((ability) => {
        if (ability.id !== abilityId) return ability;

        return {
          ...ability,
          [stepKey]: (ability[stepKey] || []).filter((_, index) => index !== stepIndex)
        };
      });

      return {
        ...prev,
        cardAbilities: {
          ...(prev.cardAbilities || {}),
          [sourceKey]: nextList
        }
      };
    });
  };

  const migrateLegacyAbilitiesToCardAbilities = (parsed) => {
    const nextCardAbilities = { ...(parsed.cardAbilities || {}) };

    for (const [sourceKey, effect] of Object.entries(parsed.effects || {})) {
      const existingList = normalizeAbilityArray(nextCardAbilities[sourceKey]);
      const migratedAbility = {
        ...effect,
        id: effect.id || makeAbilityId(sourceKey, "on_play"),
        trigger: effect.trigger || "on_play"
      };

      if (!existingList.some((ability) => ability.id === migratedAbility.id)) {
        nextCardAbilities[sourceKey] = [...existingList, migratedAbility];
      }
    }

    for (const [sourceKey, ability] of Object.entries(parsed.activateMainAbilities || {})) {
      const existingList = normalizeAbilityArray(nextCardAbilities[sourceKey]);
      const migratedAbility = {
        ...ability,
        id: ability.id || makeAbilityId(sourceKey, "activate_main"),
        trigger: ability.trigger || "activate_main",
        sourceInstanceId: ability.sourceInstanceId || sourceKey
      };

      if (!existingList.some((entry) => entry.id === migratedAbility.id)) {
        nextCardAbilities[sourceKey] = [...existingList, migratedAbility];
      }
    }

    return nextCardAbilities;
  };

  const setEffectAdditionalRestDonCost = (sourceCardId, amount) => {
    const parsedAmount = Number(amount);

    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      alert("Enter a valid additional DON cost.");
      return;
    }

    const existingEffect = scenario.effects?.[sourceCardId] || {
      id: sourceCardId,
      name: "Scenario Effect",
      steps: []
    };

    upsertScenarioEffect(sourceCardId, {
      ...existingEffect,
      id: sourceCardId,
      additionalCost: {
        ...(existingEffect.additionalCost || {}),
        restDon: parsedAmount
      }
    });
  };

  const addEffectStep = (sourceCardId, step) => {
    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    const existingEffect = scenario.effects?.[sourceCardId] || {
      id: sourceCardId,
      name: "Scenario Effect",
      steps: []
    };

    upsertScenarioEffect(sourceCardId, {
      ...existingEffect,
      id: sourceCardId,
      steps: [...(existingEffect.steps || []), step]
    });
  };

  const removeEffectStep = (sourceCardId, stepIndex) => {
    setScenario((prev) => {
      const existingEffect = prev.effects?.[sourceCardId];

      if (!existingEffect) return prev;

      const nextSteps = (existingEffect.steps || []).filter(
        (_, index) => index !== stepIndex
      );

      const nextEffects = {
        ...(prev.effects || {}),
        [sourceCardId]: {
          ...existingEffect,
          steps: nextSteps
        }
      };

      return {
        ...prev,
        effects: nextEffects
      };
    });
  };

  const addDrawSpecificStep = (sourceCardId, drawCardIdsTextValue) => {
    const cardIds = drawCardIdsTextValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!sourceCardId || cardIds.length === 0) {
      alert("Enter the event card ID and at least one card ID to draw.");
      return;
    }

    addEffectStep(sourceCardId, {
      id: `draw_specific_${Date.now()}`,
      type: "draw_specific",
      player: "you",
      cardIds,
      optional: effectStepOptional
    });
  };

  const addRestTargetStep = (sourceCardId) => {
    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    const zones = getSelectedZones(restTargetZones);

    if (zones.length === 0) {
      alert("Choose at least one valid target zone.");
      return;
    }

    addEffectStep(sourceCardId, {
      id: `rest_target_${Date.now()}`,
      type: "rest_target",
      optional: effectStepOptional,
      prompt: `Choose ${restTargetSide === "opponent" ? "an opponent" : "your"
        } ${zones.join(" or ")} to rest${effectStepOptional ? ", or skip this optional effect." : "."
        }`,
      targetRules: {
        sides: [restTargetSide],
        zones
      }
    });
  };

  const upsertActivateMainAbility = (sourceInstanceId, abilityData) => {
    if (!sourceInstanceId) return;

    setScenario((prev) => ({
      ...prev,
      activateMainAbilities: {
        ...(prev.activateMainAbilities || {}),
        [sourceInstanceId]: abilityData
      }
    }));
  };

  const removeActivateMainAbility = (sourceInstanceId) => {
    setScenario((prev) => {
      const nextAbilities = { ...(prev.activateMainAbilities || {}) };
      delete nextAbilities[sourceInstanceId];

      return {
        ...prev,
        activateMainAbilities: nextAbilities
      };
    });
  };

  const addRestToRestandDonActivateMain = () => {
    if (!activateSourceInstanceId.trim()) {
      alert("Enter a source instance ID.");
      return;
    }

    const costZones = getSelectedZones(activateRestCostZones);

    if (costZones.length === 0) {
      alert("Choose at least one cost target zone.");
      return;
    }

    const restandCount = Number(activateRestandDonCount);

    if (!Number.isFinite(restandCount) || restandCount <= 0) {
      alert("Enter a valid DON restand count.");
      return;
    }

    const sourceInstanceId = activateSourceInstanceId.trim();

    upsertActivateMainAbility(sourceInstanceId, {
      id: `${sourceInstanceId}_activate_main_${Date.now()}`,
      name: activateAbilityName || "Activate: Main",
      type: "activate_main",
      sourceInstanceId,
      oncePerTurn: activateOncePerTurn,
      costSteps: [
        {
          id: `rest_cost_${Date.now()}`,
          type: "rest_target",
          optional: false,
          prompt: "Choose a card or DON to rest as the cost.",
          targetRules: {
            sides: [activateRestCostSide],
            zones: costZones
          }
        }
      ],
      steps: [
        {
          id: `restand_don_${Date.now()}`,
          type: "restand_don",
          player: "you",
          count: restandCount
        }
      ]
    });
  };

  const addBuffPowerStep = (sourceCardId, amount) => {
    const parsedAmount = Number(amount);

    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid buff amount.");
      return;
    }

    addEffectStep(sourceCardId, {
      id: `buff_power_${Date.now()}`,
      type: "buff_power",
      amount: parsedAmount,
      optional: effectStepOptional,
      prompt: `Choose your leader or character to give +${parsedAmount} power.`,
      targetRules: {
        sides: ["you"],
        zones: ["leader", "board"]
      }
    });
  };

  const addReducePowerStep = (sourceCardId, amount) => {
    const parsedAmount = Number(amount);

    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid power reduction amount.");
      return;
    }

    addEffectStep(sourceCardId, {
      id: `reduce_power_${Date.now()}`,
      type: "reduce_power",
      amount: parsedAmount,
      optional: effectStepOptional,
      prompt: `Choose an opponent character to give -${parsedAmount} power.`,
      targetRules: {
        sides: ["opponent"],
        zones: ["board"]
      }
    });
  };

  const addKoPowerOrLessStep = (sourceCardId, maxPower) => {
    const parsedMaxPower = Number(maxPower);

    if (!sourceCardId) {
      alert("Enter the event card ID.");
      return;
    }

    if (!Number.isFinite(parsedMaxPower)) {
      alert("Enter a valid KO max power.");
      return;
    }

    addEffectStep(sourceCardId, {
      id: `ko_power_or_less_${Date.now()}`,
      type: "ko_power_or_less",
      maxPower: parsedMaxPower,
      optional: effectStepOptional,
      prompt: `Choose an opponent character with ${parsedMaxPower} power or less to KO.`,
      targetRules: {
        sides: ["opponent"],
        zones: ["board"]
      }
    });
  };

  const addAbilityDrawSpecificStep = () => {
    const cardIds = drawCardIdsText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (cardIds.length === 0) {
      alert("Enter at least one card ID to draw.");
      return;
    }

    addAbilityStep({
      id: `draw_specific_${Date.now()}`,
      type: "draw_specific",
      player: "you",
      cardIds,
      optional: effectStepOptional
    });
  };

  const addAbilityRestTargetStep = () => {
    const zones = getSelectedZones(restTargetZones);

    if (zones.length === 0) {
      alert("Choose at least one valid target zone.");
      return;
    }

    addAbilityStep(
      {
        id: `rest_target_${Date.now()}`,
        type: "rest_target",
        optional: effectStepOptional,
        prompt: `Choose ${restTargetSide === "opponent" ? "an opponent" : "your"
          } ${zones.join(" or ")} to rest${effectStepOptional ? ", or skip this optional effect." : "."
          }`,
        targetRules: {
          sides: [restTargetSide],
          zones
        }
      },
      abilityStepPlacement
    );
  };

  const addAbilityBuffPowerStep = () => {
    const parsedAmount = Number(buffPowerAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid buff amount.");
      return;
    }

    addAbilityStep({
      id: `buff_power_${Date.now()}`,
      type: "buff_power",
      amount: parsedAmount,
      optional: effectStepOptional,
      prompt: `Choose your leader or character to give +${parsedAmount} power.`,
      targetRules: {
        sides: ["you"],
        zones: ["leader", "board"]
      }
    });
  };

  const addAbilityReducePowerStep = () => {
    const parsedAmount = Number(reducePowerAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid power reduction amount.");
      return;
    }

    addAbilityStep({
      id: `reduce_power_${Date.now()}`,
      type: "reduce_power",
      amount: parsedAmount,
      optional: effectStepOptional,
      prompt: `Choose an opponent character to give -${parsedAmount} power.`,
      targetRules: {
        sides: ["opponent"],
        zones: ["board"]
      }
    });
  };

  const addAbilityKoPowerOrLessStep = () => {
    const parsedMaxPower = Number(koMaxPower);

    if (!Number.isFinite(parsedMaxPower)) {
      alert("Enter a valid KO max power.");
      return;
    }

    addAbilityStep({
      id: `ko_power_or_less_${Date.now()}`,
      type: "ko_power_or_less",
      maxPower: parsedMaxPower,
      optional: effectStepOptional,
      prompt: `Choose an opponent character with ${parsedMaxPower} power or less to KO.`,
      targetRules: {
        sides: ["opponent"],
        zones: ["board"]
      }
    });
  };

  const addAbilityRestandDonStep = () => {
    const parsedCount = Number(abilityRestandDonCount);

    if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
      alert("Enter a valid DON restand count.");
      return;
    }

    addAbilityStep({
      id: `restand_don_${Date.now()}`,
      type: "restand_don",
      player: "you",
      count: parsedCount
    });
  };



  function normalizeScenarioForExport(scenario) {
    const normalizeLeader = (card, side) => {
      if (!card) return null;

      return {
        cardId: card.cardId || card.id,
        instanceId: `${side}-leader`,
        attachedDon: card.attachedDon || [],
        rested: !!card.rested,
        passivePowerBonus: Number(card.passivePowerBonus || 0),
        traits: normalizeTraits(card.traits)
      };
    };

    const normalizeStage = (card, side) => {
      if (!card) return null;

      return {
        cardId: card.cardId || card.id,
        instanceId: `${side}-stage`,
        attachedDon: card.attachedDon || [],
        rested: !!card.rested,
        passivePowerBonus: Number(card.passivePowerBonus || 0),
        traits: normalizeTraits(card.traits)
      };
    };

    const normalizeHand = (cards) => {
      return cards.map((card) => ({
        cardId: card.cardId || card.id
      }));
    };

    const normalizeLife = (life, side) => {
      if (!Array.isArray(life)) return life;

      return life.map((card, index) => ({
        cardId: card.cardId || card.id,
        instanceId: `${side}-life-${index + 1}`,
        traits: normalizeTraits(card.traits)
      }));
    };

    const normalizeBoard = (cards, side) => {
      return cards.map((card, index) => ({
        cardId: card.cardId || card.id,
        instanceId: `${side}-board-${index + 1}`,
        attachedDon: card.attachedDon || [],
        rested: !!card.rested,
        isBlocker: !!card.isBlocker,
        summoningSick: !!card.summoningSick,
        passivePowerBonus: Number(card.passivePowerBonus || 0),
        traits: normalizeTraits(card.traits)
      }));
    };

    const normalizeSide = (sideData, side) => {
      const trashCards = normalizeHand(sideData.trash || []);

      return {
        life: normalizeLife(sideData.life, side),
        don: sideData.don || [],
        leader: normalizeLeader(sideData.leader, side),
        hand: normalizeHand(sideData.hand || []),
        deck: normalizeHand(sideData.deck || []),
        board: normalizeBoard(sideData.board || [], side),
        stage: normalizeStage(sideData.stage, side),
        trash: trashCards,
        deckCount: Number(sideData.deckCount) || 40,
        trashCount: trashCards.length || Number(sideData.trashCount) || 0
      };
    };
    return {
      id: Number(scenario.id) || 1,
      title: scenario.title || "Find Lethal #",
      difficulty: scenario.difficulty || "Medium",

      goal: scenario.goal || {
        type: "win_this_turn"
      },

      opponentAI: scenario.opponentAI || {
        counterFromHand: {
          enabled: true,
          allowedZones: ["leader", "board"],
          strategy: "minimum_to_survive"
        },
        blocker: {
          enabled: true,
          onlyWhenLethal: true
        }
      },

      initialState: {
        you: normalizeSide(scenario.initialState.you, "you"),
        opponent: normalizeSide(scenario.initialState.opponent, "opponent")
      },

      cardAbilities: scenario.cardAbilities || {},

      steps: scenario.steps?.length
        ? scenario.steps
        : [
          {
            id: "start",
            prompt: "Solve the scenario",
            options: []
          },
          {
            id: "win",
            prompt: "You win",
            options: [],
            result: "win"
          },
          {
            id: "fail",
            prompt: "Incorrect line",
            options: [],
            result: "fail"
          }
        ]
    };
  }

  function toJsValue(value, indentLevel = 0) {
    const indent = "  ".repeat(indentLevel);
    const nextIndent = "  ".repeat(indentLevel + 1);

    if (value === null) return "null";

    if (typeof value === "string") {
      return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";

      const items = value.map(
        (item) => `${nextIndent}${toJsValue(item, indentLevel + 1)}`
      );

      return `[\n${items.join(",\n")}\n${indent}]`;
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);

      if (entries.length === 0) return "{}";

      const props = entries.map(([key, val]) => {
        const isValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);

        const safeKey = isValidIdentifier
          ? key
          : `"${key.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

        return `${nextIndent}${safeKey}: ${toJsValue(val, indentLevel + 1)}`;
      });

      return `{\n${props.join(",\n")}\n${indent}}`;
    }

    return "undefined";
  }



  const exportScenario = () => {
    const cleanScenario = normalizeScenarioForExport(scenario);

    const fileText = `const scenario =
${toJsValue(cleanScenario, 1)};

module.exports = scenario;
`;

    setExportText(fileText);
  };
  const parseScenarioImportText = (text) => {
    const trimmed = text.trim();

    if (!trimmed) {
      throw new Error("No scenario text provided.");
    }

    // Supports pure JSON import.
    if (trimmed.startsWith("{")) {
      return JSON.parse(trimmed);
    }

    // Supports builder-exported JS:
    // const scenario = { ... };
    // module.exports = scenario;
    const scenarioMatch = trimmed.match(
      /const\s+scenario\s*=\s*([\s\S]*?);\s*module\.exports\s*=\s*scenario\s*;?\s*$/
    );

    if (!scenarioMatch?.[1]) {
      throw new Error("Could not find exported scenario object.");
    }

    // This is only for your local ScenarioBuilder import tool.
    // It evaluates the object literal from your own exported scenario file.
    return Function(`"use strict"; return (${scenarioMatch[1]});`)();
  };

  const hydrateCardList = async (cards = []) => {
    return Promise.all(
      (cards || []).map(async (cardRef) => {
        const cardId = cardRef.cardId || cardRef.id;

        if (!cardId) {
          return cardRef;
        }

        const res = await axios.get(`${API_BASE_URL}/card/${cardId}`);
        return hydrateCardRef(res.data, cardRef);
      })
    );
  };

  const importScenario = async () => {
    if (!exportText.trim()) return;

    try {
      const parsed = parseScenarioImportText(exportText);
      const nextScenario = structuredClone(EMPTY_SCENARIO);

      nextScenario.id = parsed.id || EMPTY_SCENARIO.id;
      nextScenario.title = parsed.title || EMPTY_SCENARIO.title;
      nextScenario.difficulty = parsed.difficulty || EMPTY_SCENARIO.difficulty;
      nextScenario.goal = parsed.goal || EMPTY_SCENARIO.goal;
      nextScenario.opponentAI = parsed.opponentAI || EMPTY_SCENARIO.opponentAI;
      nextScenario.effects = {};
      nextScenario.activateMainAbilities = {};
      nextScenario.cardAbilities = migrateLegacyAbilitiesToCardAbilities(parsed);
      nextScenario.steps = parsed.steps || EMPTY_SCENARIO.steps;

      const hydrateSide = async (side) => {
        const source = parsed.initialState?.[side];
        if (!source) return;

        nextScenario.initialState[side].deckCount = source.deckCount ?? 40;
        nextScenario.initialState[side].trashCount = source.trashCount ?? 0;
        nextScenario.initialState[side].don = Array.isArray(source.don)
          ? source.don
          : [];

        if (source.leader?.cardId) {
          const res = await axios.get(`${API_BASE_URL}/card/${source.leader.cardId}`);
          nextScenario.initialState[side].leader = hydrateCardRef(
            res.data,
            source.leader
          );
        } else {
          nextScenario.initialState[side].leader = null;
        }

        if (source.stage?.cardId) {
          const res = await axios.get(`${API_BASE_URL}/card/${source.stage.cardId}`);
          nextScenario.initialState[side].stage = hydrateCardRef(
            res.data,
            source.stage
          );
        } else {
          nextScenario.initialState[side].stage = null;
        }

        nextScenario.initialState[side].hand = await hydrateCardList(source.hand || []);
        nextScenario.initialState[side].deck = await hydrateCardList(source.deck || []);
        nextScenario.initialState[side].trash = await hydrateCardList(source.trash || []);
        nextScenario.initialState[side].life = await hydrateCardList(source.life || []);
        nextScenario.initialState[side].board = await hydrateCardList(source.board || []);

        nextScenario.initialState[side].trashCount =
          nextScenario.initialState[side].trash.length || source.trashCount || 0;
      };

      await hydrateSide("you");
      await hydrateSide("opponent");

      setScenario(nextScenario);
      alert("Scenario imported.");
    } catch (error) {
      console.error("Import scenario error:", error);
      alert(`Import failed: ${error.message}`);
    }
  };

  const downloadScenario = () => {
    const cleanScenario = normalizeScenarioForExport(scenario);

    const content =
      exportText ||
      `const scenario =
${toJsValue(cleanScenario, 1)};

module.exports = scenario;
`;

    const blob = new Blob([content], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `scenario-${Number(cleanScenario.id) || 1}.js`;
    a.click();

    URL.revokeObjectURL(url);
  };
  const renderDonPresetPanel = (side, label) => {
    const sideData = scenario.initialState[side];

    const targets = [
      sideData.leader,
      ...(sideData.board || [])
    ].filter(Boolean);

    return (
      <section className="panel">
        <h2>{label} DON Preset</h2>

        {sideData.don.length === 0 ? (
          <p>No DON. Set DON count first.</p>
        ) : (
          sideData.don.map((donCard) => (
            <BuilderListCard
              key={`${side}-don-${donCard.id}`}
              title={`DON ${donCard.id} ${donCard.rested ? "- Rested" : "- Active"
                } ${donCard.attachedTo
                  ? `- Attached to ${donCard.attachedTo}`
                  : "- Unattached"
                }`}
            >
              <button onClick={() => toggleDonRested(side, donCard.id)}>
                {donCard.rested ? "Set Active" : "Set Rested"}
              </button>

              <button onClick={() => clearDonAttachmentInBuilder(side, donCard.id)}>
                Clear Attachment
              </button>

              {targets.map((target) => (
                <button
                  key={`${side}-don-${donCard.id}-${target.instanceId}`}
                  onClick={() =>
                    attachDonToTargetInBuilder(
                      side,
                      donCard.id,
                      target.instanceId
                    )
                  }
                >
                  {donCard.attachedTo === target.instanceId
                    ? `Unattach from ${target.name || target.cardId}`
                    : `Attach to ${target.name || target.cardId}`}
                </button>
              ))}
            </BuilderListCard>
          ))
        )}
      </section>
    );
  };
  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper builder-scroll">
          <section className="panel">
            <h1>Scenario Builder</h1>

            <label>ID</label>
            <input
              value={scenario.id}
              onChange={(e) => updateScenarioMeta("id", e.target.value)}
            />

            <label>Title</label>
            <input
              value={scenario.title}
              onChange={(e) => updateScenarioMeta("title", e.target.value)}
            />

            <label>Difficulty</label>
            <input
              value={scenario.difficulty}
              onChange={(e) => updateScenarioMeta("difficulty", e.target.value)}
            />

            <label>Goal Type</label>
            <select value={scenario.goal?.type || "win_this_turn"} onChange={(e) => setGoalType(e.target.value)}>
              <option value="win_this_turn">win_this_turn</option>
              <option value="survive_this_turn">survive_this_turn</option>
              <option value="ko_specific_character">ko_specific_character</option>
            </select>
          </section>

          <section className="panel">
            <h2>Card Search</h2>
            <div className="builder-row">
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="OP01-001"
              />
              <button onClick={fetchCard} disabled={loading}>
                {loading ? "Loading..." : "Fetch"}
              </button>
            </div>

            {cardResult && (
              <div className="builder-search-result">
                <img src={cardResult.image} alt={cardResult.name} className="builder-search-image" />
                <div>
                  <p><strong>{cardResult.name}</strong></p>
                  <p>Type: {cardResult.type || "-"}</p>
                  <p>Cost: {cardResult.cost ?? "-"}</p>
                  <div className="builder-button-wrap">
                    <button onClick={() => addLeader("you")}>Set Your Leader</button>
                    <button onClick={() => addLeader("opponent")}>Set Opponent Leader</button>
                    <button onClick={() => setStage("you")}>Set Your Stage</button>
                    <button onClick={() => setStage("opponent")}>Set Opponent Stage</button>
                    <button onClick={() => addToHand("you")}>Add to Your Hand</button>
                    <button onClick={() => addToHand("opponent")}>Add to Opponent Hand</button>
                    <button onClick={() => addToDeck("you")}>Add to Your Deck</button>
                    <button onClick={() => addToDeck("opponent")}>Add to Opponent Deck</button>
                    <button onClick={() => addToTrash("you")}>Add to Your Trash</button>
                    <button onClick={() => addToTrash("opponent")}>Add to Opponent Trash</button>
                    <button onClick={() => addToBoard("you")}>Add to Your Board</button>
                    <button onClick={() => addToBoard("opponent")}>Add to Opponent Board</button>
                    <button onClick={() => addToLife("you")}>Add to Your Life</button>
                    <button onClick={() => addToLife("opponent")}>Add to Opponent Life</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Live Preview</h2>
            <ScenarioPreview scenario={scenario} />
          </section>

          <section className="panel">
            <h2>Counts</h2>
            <div className="builder-grid-two">
              <div>
                <h3>You</h3>
                <label>DON Count</label>
                <input
                  type="number"
                  value={scenario.initialState.you.don.length}
                  onChange={(e) => updatePlayerField("you", "don", buildDonArray(e.target.value))}
                />
                <label>Deck Count</label>
                <input
                  type="number"
                  value={scenario.initialState.you.deckCount}
                  onChange={(e) => updatePlayerField("you", "deckCount", Number(e.target.value))}
                />
                <label>Trash Count</label>
                <input
                  type="number"
                  value={(scenario.initialState.you.trash || []).length}
                  readOnly
                />
              </div>

              <div>
                <h3>Opponent</h3>
                <label>DON Count</label>
                <input
                  type="number"
                  value={scenario.initialState.opponent.don.length}
                  onChange={(e) =>
                    updatePlayerField("opponent", "don", buildDonArray(e.target.value))
                  }
                />
                <label>Deck Count</label>
                <input
                  type="number"
                  value={scenario.initialState.opponent.deckCount}
                  onChange={(e) =>
                    updatePlayerField("opponent", "deckCount", Number(e.target.value))
                  }
                />
                <label>Trash Count</label>
                <input
                  type="number"
                  value={scenario.initialState.opponent.trashCount}
                  onChange={(e) =>
                    updatePlayerField("opponent", "trashCount", Number(e.target.value))
                  }
                  readOnly
                />
              </div>
            </div>
          </section>
          {renderDonPresetPanel("you", "Your")}
          {renderDonPresetPanel("opponent", "Opponent")}

          <section className="panel">
            <h2>Leaders / Stage</h2>
            <div className="builder-grid-two">
              <div>
                <h3>You</h3>
                <BuilderListCard title={scenario.initialState.you.leader?.name || "No leader set"}>
                  <button onClick={() => clearLeader("you")}>Clear Leader</button>
                  {renderPassivePowerInput("you", scenario.initialState.you.leader)}
                  {renderTraitsInput("you", scenario.initialState.you.leader)}
                </BuilderListCard>
                <BuilderListCard title={scenario.initialState.you.stage?.name || "No stage set"}>
                  {renderPassivePowerInput("you", scenario.initialState.you.stage)}
                  <button onClick={() => clearStage("you")}>Clear Stage</button>
                </BuilderListCard>
              </div>

              <div>
                <h3>Opponent</h3>
                <BuilderListCard title={scenario.initialState.opponent.leader?.name || "No leader set"}>
                  <button onClick={() => clearLeader("opponent")}>Clear Leader</button>
                  {renderPassivePowerInput("opponent", scenario.initialState.opponent.leader)}
                  {renderTraitsInput("opponent", scenario.initialState.opponent.leader)}
                </BuilderListCard>
                <BuilderListCard title={scenario.initialState.opponent.stage?.name || "No stage set"}>
                  {renderPassivePowerInput("opponent", scenario.initialState.opponent.stage)}
                  <button onClick={() => clearStage("opponent")}>Clear Stage</button>
                </BuilderListCard>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Your Trash</h2>
            {(scenario.initialState.you.trash || []).length === 0 ? (
              <p>No trash cards.</p>
            ) : (
              scenario.initialState.you.trash.map((card, index) => (
                <BuilderListCard
                  key={`you-trash-${index}`}
                  title={card.name || card.cardId}
                >
                  <button onClick={() => removeFromTrash("you", index)}>
                    Remove
                  </button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Opponent Trash</h2>
            {(scenario.initialState.opponent.trash || []).length === 0 ? (
              <p>No trash cards.</p>
            ) : (
              scenario.initialState.opponent.trash.map((card, index) => (
                <BuilderListCard
                  key={`opp-trash-${index}`}
                  title={card.name || card.cardId}
                >
                  <button onClick={() => removeFromTrash("opponent", index)}>
                    Remove
                  </button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Your Hand</h2>
            {scenario.initialState.you.hand.length === 0 ? (
              <p>No cards.</p>
            ) : (
              scenario.initialState.you.hand.map((card, index) => (
                <BuilderListCard key={`you-hand-${index}`} title={card.name || card.cardId}>
                  <button onClick={() => removeFromHand("you", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Opponent Hand</h2>
            {scenario.initialState.opponent.hand.length === 0 ? (
              <p>No cards.</p>
            ) : (
              scenario.initialState.opponent.hand.map((card, index) => (
                <BuilderListCard key={`opp-hand-${index}`} title={card.name || card.cardId}>
                  <button onClick={() => removeFromHand("opponent", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Your Deck</h2>
            {(scenario.initialState.you.deck || []).length === 0 ? (
              <p>No scripted deck cards.</p>
            ) : (
              scenario.initialState.you.deck.map((card, index) => (
                <BuilderListCard
                  key={`you-deck-${index}`}
                  title={card.name || card.cardId}
                >
                  <button onClick={() => removeFromDeck("you", index)}>
                    Remove
                  </button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Opponent Deck</h2>
            {(scenario.initialState.opponent.deck || []).length === 0 ? (
              <p>No scripted deck cards.</p>
            ) : (
              scenario.initialState.opponent.deck.map((card, index) => (
                <BuilderListCard
                  key={`opp-deck-${index}`}
                  title={card.name || card.cardId}
                >
                  <button onClick={() => removeFromDeck("opponent", index)}>
                    Remove
                  </button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Your Life</h2>
            {scenario.initialState.you.life.length === 0 ? (
              <p>No life cards.</p>
            ) : (
              scenario.initialState.you.life.map((card, index) => (
                <BuilderListCard key={card.instanceId || `you-life-${index}`} title={card.name || card.cardId}>
                  {renderPassivePowerInput("you", card)}
                  {renderTraitsInput("you", card)}
                  <button onClick={() => removeFromLife("you", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Opponent Life</h2>
            {scenario.initialState.opponent.life.length === 0 ? (
              <p>No life cards.</p>
            ) : (
              scenario.initialState.opponent.life.map((card, index) => (
                <BuilderListCard key={card.instanceId || `opp-life-${index}`} title={card.name || card.cardId}>
                  {renderPassivePowerInput("opponent", card)}
                  {renderTraitsInput("opponent", card)}
                  <button onClick={() => removeFromLife("opponent", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Your Board</h2>
            {scenario.initialState.you.board.length === 0 ? (
              <p>No board cards.</p>
            ) : (
              scenario.initialState.you.board.map((card, index) => (
                <BuilderListCard key={card.instanceId} title={`${card.name || card.cardId} (${card.instanceId})`}>
                  {renderPassivePowerInput("you", card)}
                  {renderTraitsInput("you", card)}
                  <button onClick={() => toggleBoardField("you", index, "rested")}>
                    {card.rested ? "Unset Rested" : "Set Rested"}
                  </button>
                  <button onClick={() => toggleBoardField("you", index, "isBlocker")}>
                    {card.isBlocker ? "Unset Blocker" : "Set Blocker"}
                  </button>
                  <button onClick={() => toggleBoardField("you", index, "summoningSick")}>
                    {card.summoningSick ? "Unset Summoning Sick" : "Set Summoning Sick"}
                  </button>
                  <button onClick={() => removeBoardCard("you", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Opponent Board</h2>
            {scenario.initialState.opponent.board.length === 0 ? (
              <p>No board cards.</p>
            ) : (
              scenario.initialState.opponent.board.map((card, index) => (
                <BuilderListCard key={card.instanceId} title={`${card.name || card.cardId} (${card.instanceId})`}>
                  {renderPassivePowerInput("opponent", card)}
                  {renderTraitsInput("opponent", card)}
                  <button onClick={() => toggleBoardField("opponent", index, "rested")}>
                    {card.rested ? "Unset Rested" : "Set Rested"}
                  </button>
                  <button onClick={() => toggleBoardField("opponent", index, "isBlocker")}>
                    {card.isBlocker ? "Unset Blocker" : "Set Blocker"}
                  </button>
                  <button onClick={() => toggleBoardField("opponent", index, "summoningSick")}>
                    {card.summoningSick ? "Unset Summoning Sick" : "Set Summoning Sick"}
                  </button>
                  <button onClick={() => removeBoardCard("opponent", index)}>Remove</button>
                </BuilderListCard>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Card Abilities</h2>

            <p>
              Build abilities by choosing a source card, trigger tag, and then adding
              cost/effect steps. Use card IDs for On Play events/cards, and instance IDs
              like <strong>you-leader</strong> for leaders or board cards.
            </p>

            <label>Source Card ID / Instance ID</label>
            <input
              value={abilitySourceKey}
              onChange={(event) => setAbilitySourceKey(event.target.value)}
              placeholder="OP12-037 or you-leader"
            />



            <label>Trigger Tag</label>
            <select
              value={abilityTrigger}
              onChange={(event) => setAbilityTrigger(event.target.value)}
            >
              {ABILITY_TRIGGER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label>Ability Name</label>
            <input
              value={abilityName}
              onChange={(event) => setAbilityName(event.target.value)}
              placeholder="Rest 2 Opponent Cards"
            />

            <label>
              <input
                type="checkbox"
                checked={abilityOncePerTurn}
                onChange={(event) => setAbilityOncePerTurn(event.target.checked)}
              />
              Once Per Turn
            </label>

            <label>Required Attached DON on Source (Activate: Main only)</label>
            <input
              type="number"
              value={activateRequiredAttachedDon}
              disabled={abilityTrigger !== "activate_main"}
              onChange={(event) =>
                setActivateRequiredAttachedDon(Number(event.target.value))
              }
              placeholder="0"
            />

            <label>Additional DON to Rest on Play (On Play only)</label>
            <input
              type="number"
              value={eventAdditionalRestDon}
              disabled={abilityTrigger !== "on_play"}
              onChange={(event) =>
                setEventAdditionalRestDon(Number(event.target.value))
              }
              placeholder="0"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={createOrUpdateCurrentAbility}>
                Create / Update Ability
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Step Settings</h3>

            <label>
              <input
                type="checkbox"
                checked={effectStepOptional}
                onChange={(event) => setEffectStepOptional(event.target.checked)}
              />
              Optional Step
            </label>

            <label>Step Placement</label>
            <select
              value={abilityStepPlacement}
              onChange={(event) => setAbilityStepPlacement(event.target.value)}
            >
              <option value="steps">Ability Step</option>
              <option value="costSteps">Cost Step</option>
            </select>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Rest Target</h3>

            <label>Target Side</label>
            <select
              value={restTargetSide}
              onChange={(event) => setRestTargetSide(event.target.value)}
            >
              <option value="you">You</option>
              <option value="opponent">Opponent</option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={restTargetZones.leader}
                onChange={() => toggleZone(setRestTargetZones, "leader")}
              />
              Leader
            </label>

            <label>
              <input
                type="checkbox"
                checked={restTargetZones.board}
                onChange={() => toggleZone(setRestTargetZones, "board")}
              />
              Character / Board
            </label>

            <label>
              <input
                type="checkbox"
                checked={restTargetZones.stage}
                onChange={() => toggleZone(setRestTargetZones, "stage")}
              />
              Stage
            </label>

            <label>
              <input
                type="checkbox"
                checked={restTargetZones.don}
                onChange={() => toggleZone(setRestTargetZones, "don")}
              />
              DON
            </label>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Return Target to Hand</h3>

            <p>
              Uses the same Target Side and Zone checkboxes above. For this ability, use:
              You + Character / Board.
            </p>

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityReturnTargetToHandStep}>
                Add Return Target to Hand Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Play Top Life If</h3>

            <label>Exact Cost</label>
            <input
              type="number"
              value={playFromLifeExactCost}
              onChange={(event) =>
                setPlayFromLifeExactCost(Number(event.target.value))
              }
            />

            <label>Required Traits</label>
            <input
              value={playFromLifeTraitsText}
              onChange={(event) => setPlayFromLifeTraitsText(event.target.value)}
              placeholder="Supernovas"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityPlayTopLifeIfStep}>
                Add Play Top Life If Step
              </button>
            </div>

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityRestTargetStep}>
                Add Rest Target Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Restand DON</h3>

            <label>DON Count</label>
            <input
              type="number"
              value={abilityRestandDonCount}
              onChange={(event) =>
                setAbilityRestandDonCount(Number(event.target.value))
              }
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityRestandDonStep}>
                Add Restand DON Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Draw Specific Cards</h3>

            <label>Draw Card IDs</label>
            <input
              value={drawCardIdsText}
              onChange={(event) => setDrawCardIdsText(event.target.value)}
              placeholder="OP05-015, OP05-015"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityDrawSpecificStep}>
                Add Draw Specific Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Buff Power</h3>

            <label>Buff Amount</label>
            <input
              type="number"
              value={buffPowerAmount}
              onChange={(event) => setBuffPowerAmount(Number(event.target.value))}
              placeholder="2000"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityBuffPowerStep}>
                Add Buff Power Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: Reduce Power</h3>

            <label>Power Reduction Amount</label>
            <input
              type="number"
              value={reducePowerAmount}
              onChange={(event) => setReducePowerAmount(Number(event.target.value))}
              placeholder="4000"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityReducePowerStep}>
                Add Reduce Power Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Add Step: KO Power or Less</h3>

            <label>KO Max Power</label>
            <input
              type="number"
              value={koMaxPower}
              onChange={(event) => setKoMaxPower(Number(event.target.value))}
              placeholder="0"
            />

            <div className="builder-button-wrap" style={{ marginTop: "8px" }}>
              <button onClick={addAbilityKoPowerOrLessStep}>
                Add KO Power or Less Step
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3>Current Card Abilities</h3>

            {Object.keys(scenario.cardAbilities || {}).length === 0 ? (
              <p>No card abilities.</p>
            ) : (
              Object.entries(scenario.cardAbilities || {}).map(
                ([sourceKey, abilityEntry]) => (
                  <div key={sourceKey} className="builder-list-card">
                    <div className="builder-list-card-title">
                      Source: {sourceKey}
                    </div>

{normalizeAbilityArray(abilityEntry).map((ability, abilityIndex) => (
  <div
    key={ability.id || `${sourceKey}-ability-${abilityIndex}`}
                        className="builder-list-card"
                        style={{ marginTop: "8px" }}
                      >
                        <div className="builder-list-card-title">
                          {ABILITY_TRIGGER_OPTIONS.find(
                            (option) => option.value === ability.trigger
                          )?.label || ability.trigger}
                          {" - "}
                          {ability.name || "Ability"}
                          {ability.oncePerTurn ? " - Once Per Turn" : ""}
                          {ability.requirements?.sourceAttachedDon
                            ? ` - DON!! x${ability.requirements.sourceAttachedDon}`
                            : ""}
                          {ability.additionalCost?.restDon
                            ? ` - Extra DON Cost: ${ability.additionalCost.restDon}`
                            : ""}
                        </div>

                        {(ability.costSteps || []).length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <strong>Cost Steps</strong>
                            {(ability.costSteps || []).map((step, index) => (
                              <div
                                key={step.id || `${ability.id}-cost-${index}`}
                                className="builder-list-card"
                                style={{ marginTop: "8px" }}
                              >
                                <div className="builder-list-card-title">
                                  Cost {index + 1}. {step.type}
                                  {step.optional ? " - Optional" : " - Required"}
                                </div>
                                <div className="builder-list-card-actions">
                                  <button
                                    onClick={() =>
                                      removeAbilityStep(
                                        sourceKey,
                                        ability.id,
                                        "costSteps",
                                        index
                                      )
                                    }
                                  >
                                    Remove Cost Step
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: "8px" }}>
                          <strong>Ability Steps</strong>
                          {(ability.steps || []).length === 0 ? (
                            <p>No ability steps.</p>
                          ) : (
                            (ability.steps || []).map((step, index) => (
                              <div
                                key={step.id || `${ability.id}-step-${index}`}
                                className="builder-list-card"
                                style={{ marginTop: "8px" }}
                              >
                                <div className="builder-list-card-title">
                                  Step {index + 1}. {step.type}
                                  {step.amount != null ? ` (${step.amount})` : ""}
                                  {step.count != null ? ` (${step.count})` : ""}
                                  {step.maxPower != null
                                    ? ` (max ${step.maxPower})`
                                    : ""}
                                  {step.cardIds
                                    ? ` (${step.cardIds.join(", ")})`
                                    : ""}
                                  {step.optional ? " - Optional" : " - Required"}
                                </div>
                                <div className="builder-list-card-actions">
                                  <button
                                    onClick={() =>
                                      removeAbilityStep(
                                        sourceKey,
                                        ability.id,
                                        "steps",
                                        index
                                      )
                                    }
                                  >
                                    Remove Step
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div
                          className="builder-list-card-actions"
                          style={{ marginTop: "8px" }}
                        >
                          <button onClick={() => removeCardAbility(sourceKey, ability.id)}>
                            Remove Ability
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </section>

          <section className="panel">
            <h2>Export / Import JSON</h2>
            <div className="builder-button-wrap">
              <button onClick={exportScenario}>Export JSON</button>
              <button onClick={importScenario}>Import JSON</button>
              <button onClick={downloadScenario}>Download JSON</button>
            </div>
            <textarea
              value={exportText}
              onChange={(e) => setExportText(e.target.value)}
              style={{ width: "100%", minHeight: "320px", marginTop: "12px" }}
            />
          </section>
        </main>

        <aside className="sidebar">
          <section className="panel">
            <h2>Builder Notes</h2>
            <p>Live preview now updates immediately.</p>
            <p>You can remove cards from hand, life, board, leader, and stage.</p>
            <p>Export strips card data back down to scenario-friendly refs.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}