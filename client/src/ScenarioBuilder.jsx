import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://localhost:3000";

const DON_IMAGE =
  "https://www.optcgapi.com/media/static/Card_Images/DON_Card__Green_Compass_-_Starter_Deck_1_Straw_Hat_Crew_ST-01_img.jpg";

const EMPTY_SCENARIO = {
  id: 1,
  title: "Daily Test",
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
      board: [],
      stage: null,
      deckCount: 40,
      trashCount: 0
    },
    opponent: {
      life: [],
      don: [],
      leader: null,
      hand: [],
      board: [],
      stage: null,
      deckCount: 40,
      trashCount: 0
    }
  },
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
  return basePower + donBonus;
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

function makeBoardInstance(cardData, side, index) {
  return {
    ...cardData,
    cardId: cardData.id,
    instanceId: `${side}-board-${index + 1}`,
    attachedDon: [],
    rested: false,
    isBlocker: false,
    summoningSick: false
  };
}

function makeLeaderInstance(cardData, side) {
  return {
    ...cardData,
    cardId: cardData.id,
    instanceId: `${side}-leader`,
    attachedDon: [],
    rested: false
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
    instanceId: `${side}-life-${index + 1}`
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
      rested: false
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

 const cleanCardRef = (card) => {
  if (!card) return null;

  return {
    cardId: card.cardId || card.id,
    instanceId: card.instanceId,
    attachedDon: card.attachedDon || [],
    rested: !!card.rested
  };
};

const cleanBoardCardRef = (card) => {
  if (!card) return null;

  return {
    cardId: card.cardId || card.id,
    instanceId: card.instanceId,
    attachedDon: card.attachedDon || [],
    rested: !!card.rested,
    isBlocker: !!card.isBlocker,
    summoningSick: !!card.summoningSick
  };
};

const cleanHandCardRef = (card) => ({
  cardId: card.cardId || card.id
});

const cleanLifeCardRef = (card) => ({
  cardId: card.cardId || card.id,
  instanceId: card.instanceId
});

const cleanSide = (sideData) => ({
  life: Array.isArray(sideData.life)
    ? sideData.life.map(cleanLifeCardRef)
    : sideData.life,
  don: sideData.don,
  leader: sideData.leader ? cleanCardRef(sideData.leader) : null,
  hand: sideData.hand.map(cleanHandCardRef),
  board: sideData.board.map(cleanBoardCardRef),
  stage: sideData.stage ? cleanCardRef(sideData.stage) : null,
  deckCount: sideData.deckCount ?? 40,
  trashCount: sideData.trashCount ?? 0
});

function normalizeScenarioForExport(scenario) {
  const normalizeLeader = (card, side) => {
    if (!card) return null;

    return {
      cardId: card.cardId || card.id,
      instanceId: `${side}-leader`,
      attachedDon: card.attachedDon || [],
      rested: !!card.rested
    };
  };

  const normalizeStage = (card, side) => {
    if (!card) return null;

    return {
      cardId: card.cardId || card.id,
      instanceId: `${side}-stage`,
      attachedDon: card.attachedDon || [],
      rested: !!card.rested
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
      instanceId: `${side}-life-${index + 1}`
    }));
  };

  const normalizeBoard = (cards, side) => {
    return cards.map((card, index) => ({
      cardId: card.cardId || card.id,
      instanceId: `${side}-board-${index + 1}`,
      attachedDon: card.attachedDon || [],
      rested: !!card.rested,
      isBlocker: !!card.isBlocker,
      summoningSick: !!card.summoningSick
    }));
  };

  const normalizeSide = (sideData, side) => ({
    life: normalizeLife(sideData.life, side),
    don: sideData.don || [],
    leader: normalizeLeader(sideData.leader, side),
    hand: normalizeHand(sideData.hand || []),
    board: normalizeBoard(sideData.board || [], side),
    stage: normalizeStage(sideData.stage, side),
    deckCount: Number(sideData.deckCount) || 40,
    trashCount: Number(sideData.trashCount) || 0
  });

  return {
    id: Number(scenario.id) || 1,
    title: scenario.title || "Daily Test",
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

    const items = value.map((item) => `${nextIndent}${toJsValue(item, indentLevel + 1)}`);

    return `[\n${items.join(",\n")}\n${indent}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);

    if (entries.length === 0) return "{}";

    const props = entries.map(([key, val]) => {
      return `${nextIndent}${key}: ${toJsValue(val, indentLevel + 1)}`;
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
  const importScenario = async () => {
    if (!exportText.trim()) return;

    try {
      const parsed = JSON.parse(exportText);
      const nextScenario = structuredClone(EMPTY_SCENARIO);

      nextScenario.id = parsed.id || EMPTY_SCENARIO.id;
      nextScenario.title = parsed.title || EMPTY_SCENARIO.title;
      nextScenario.difficulty = parsed.difficulty || EMPTY_SCENARIO.difficulty;
      nextScenario.goal = parsed.goal || EMPTY_SCENARIO.goal;
      nextScenario.opponentAI = parsed.opponentAI || EMPTY_SCENARIO.opponentAI;

      const hydrateSide = async (side) => {
        const source = parsed.initialState?.[side];
        if (!source) return;

        nextScenario.initialState[side].deckCount = source.deckCount ?? 40;
        nextScenario.initialState[side].trashCount = source.trashCount ?? 0;
        nextScenario.initialState[side].don = Array.isArray(source.don) ? source.don : [];

        if (source.leader?.cardId) {
          const res = await axios.get(`${API_BASE_URL}/card/${source.leader.cardId}`);
          nextScenario.initialState[side].leader = hydrateCardRef(res.data, source.leader);
        }

        if (source.stage?.cardId) {
          const res = await axios.get(`${API_BASE_URL}/card/${source.stage.cardId}`);
          nextScenario.initialState[side].stage = hydrateCardRef(res.data, source.stage);
        }

        nextScenario.initialState[side].hand = await Promise.all(
          (source.hand || []).map(async (cardRef) => {
            const res = await axios.get(`${API_BASE_URL}/card/${cardRef.cardId}`);
            return hydrateCardRef(res.data, cardRef);
          })
        );

        nextScenario.initialState[side].life = await Promise.all(
          (source.life || []).map(async (cardRef) => {
            const res = await axios.get(`${API_BASE_URL}/card/${cardRef.cardId}`);
            return hydrateCardRef(res.data, cardRef);
          })
        );

        nextScenario.initialState[side].board = await Promise.all(
          (source.board || []).map(async (cardRef) => {
            const res = await axios.get(`http://localhost:3000/card/${cardRef.cardId}`);
            return hydrateCardRef(res.data, cardRef);
          })
        );
      };

      await hydrateSide("you");
      await hydrateSide("opponent");
      setScenario(nextScenario);
      alert("Scenario imported.");
    } catch (error) {
      console.error(error);
      alert("Invalid JSON or failed to hydrate cards.");
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
                  value={scenario.initialState.you.trashCount}
                  onChange={(e) => updatePlayerField("you", "trashCount", Number(e.target.value))}
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
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Leaders / Stage</h2>
            <div className="builder-grid-two">
              <div>
                <h3>You</h3>
                <BuilderListCard title={scenario.initialState.you.leader?.name || "No leader set"}>
                  <button onClick={() => clearLeader("you")}>Clear Leader</button>
                </BuilderListCard>
                <BuilderListCard title={scenario.initialState.you.stage?.name || "No stage set"}>
                  <button onClick={() => clearStage("you")}>Clear Stage</button>
                </BuilderListCard>
              </div>

              <div>
                <h3>Opponent</h3>
                <BuilderListCard title={scenario.initialState.opponent.leader?.name || "No leader set"}>
                  <button onClick={() => clearLeader("opponent")}>Clear Leader</button>
                </BuilderListCard>
                <BuilderListCard title={scenario.initialState.opponent.stage?.name || "No stage set"}>
                  <button onClick={() => clearStage("opponent")}>Clear Stage</button>
                </BuilderListCard>
              </div>
            </div>
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
            <h2>Your Life</h2>
            {scenario.initialState.you.life.length === 0 ? (
              <p>No life cards.</p>
            ) : (
              scenario.initialState.you.life.map((card, index) => (
                <BuilderListCard key={card.instanceId || `you-life-${index}`} title={card.name || card.cardId}>
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