import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const DON_IMAGE =
  "https://www.optcgapi.com/media/static/Card_Images/DON_Card__Green_Compass_-_Starter_Deck_1_Straw_Hat_Crew_ST-01_img.jpg";

function CardTile({
  card,
  hidden = false,
  variant = "board",
  setHoveredCard,
  onClick,
  powerValue,
  attachedDonCount = 0
}) {
  const className = `card-tile ${variant}`;

  if (hidden) return <div className={`${className} card-back`} />;
  if (!card) return <div className={`${className} card-empty`} />;

  return (
<div
  className={className}
  onMouseEnter={() => setHoveredCard?.(card)}
  onMouseLeave={() => setHoveredCard?.(null)}
  onClick={() => onClick?.(card)}
>
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

function DonArea({ don, selectedDonId, onDonClick }) {
  const donCards = Array.isArray(don)
    ? don.filter((donCard) => donCard.attachedTo === null)
    : Array.from({ length: Number(don) || 0 }, (_, index) => ({
        id: index + 1,
        rested: false,
        attachedTo: null
      }));

  return (
    <div className="don-area">
      {donCards.map((donCard, index) => (
        <div
          key={donCard.id ?? index}
          className={`don-stack-item ${
            selectedDonId === donCard.id ? "selected-don" : ""
          }`}
          style={{ left: `${index * 14}px`, zIndex: index + 1 }}
          onClick={() => {
            if (donCard.attachedTo === null) {
              onDonClick?.(donCard.id);
            }
          }}
        >
          <DonCard rested={!!donCard.rested} small />
        </div>
      ))}
    </div>
  );
}
function LifeStack({ count }) {
  const cards = Array.from({ length: count || 0 });

  return (
    <div className="life-stack">
      {cards.map((_, index) => (
        <div
          key={index}
          className="life-card"
          style={{
            top: `${index * 10}px`,
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

function CharacterCards({ cards, setHoveredCard, onCardClick }) {
  return (
    <div className="character-cards">
      {cards?.map((card, index) => (
        <CardTile
          key={`${card.id || card.name}-${index}`}
          card={card}
          variant="board"
          setHoveredCard={setHoveredCard}
          onClick={onCardClick}
          powerValue={getDisplayedPower(card)}
          attachedDonCount={card.attachedDon?.length || 0}
        />
      ))}
    </div>
  );
}

function OpponentBoard({ data, setHoveredCard }) {
  return (
    <div className="board-area opponent-board">
      <div className="hand-strip top-hand">
        {data.hand?.map((card, index) => (
          <CardTile
            key={`${card.id || card.name}-${index}`}
            card={card}
            variant="hand"
            setHoveredCard={setHoveredCard}
          />
        ))}
      </div>

      <div className="board-body">
        <div className="life-column">
          <LifeStack count={data.life ?? 0} />
        </div>

        <div className="playmat">
          <div className="resource-split-row">
            <Zone title="DON!! Area" className="don-zone">
              <DonArea don={data.don} selectedDonId={null} onDonClick={() => {}} />
            </Zone>

            <Zone title="Trash" className="trash-zone">
              <div className="stack-card trash-box">{data.trashCount ?? 0}</div>
            </Zone>
          </div>

          <div className="mid-row opponent-mid-row">
            <Zone title="Deck" className="deck-zone">
              <div className="deck-stack">
                <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                <div className="deck-count">{data.deckCount ?? 40}</div>
              </div>
            </Zone>

<Zone title="Stage" className="stage-zone">
  <CardTile
    card={data.stage || null}
    variant="stage"
    setHoveredCard={setHoveredCard}
  />
</Zone>

            <Zone title="Leader" className="leader-zone">
              <CardTile card={data.leader || null} variant="leader" setHoveredCard={setHoveredCard} powerValue={getDisplayedPower(data.leader)}/>

            </Zone>
          </div>

          <Zone title="Character Area" className="character-zone">
            <CharacterCards cards={data.board} setHoveredCard={setHoveredCard} />
          </Zone>
        </div>
      </div>
    </div>
  );
}

function PlayerBoard({ data, setHoveredCard, selectedDonId, onDonClick, onAttachTargetClick }) {
  return (
    <div className="board-area player-board">
      <div className="board-body">
        <div className="life-column">
          <LifeStack count={data.life ?? 0} />
        </div>

        <div className="playmat">
          <Zone title="Character Area" className="character-zone">
            <CharacterCards
              cards={data.board}
              setHoveredCard={setHoveredCard}
              onCardClick={onAttachTargetClick}
            />
          </Zone>

          <div className="mid-row player-mid-row">
<Zone title="Leader" className="leader-zone">
  <CardTile
    card={data.leader || null}
    variant="leader"
    setHoveredCard={setHoveredCard}
    onClick={onAttachTargetClick}
    powerValue={getDisplayedPower(data.leader)}
    attachedDonCount={data.leader?.attachedDon?.length || 0}
  />
</Zone>

<Zone title="Stage" className="stage-zone">
  <CardTile
    card={data.stage || null}
    variant="stage"
    setHoveredCard={setHoveredCard}
  />
</Zone>

            <Zone title="Deck" className="deck-zone">
              <div className="deck-stack">
                <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                <div className="deck-count">{data.deckCount ?? 40}</div>
              </div>
            </Zone>
          </div>

          <div className="resource-split-row">
            <Zone title="DON!! Area" className="don-zone">
              <DonArea
  don={data.don}
  selectedDonId={selectedDonId}
  onDonClick={onDonClick}
/>
            </Zone>

            <Zone title="Trash" className="trash-zone">
              <div className="stack-card trash-box">{data.trashCount ?? 0}</div>
            </Zone>
          </div>
        </div>
      </div>

      <div className="hand-strip bottom-hand">
        {data.hand?.map((card, index) => (
          <CardTile
            key={`${card.id || card.name}-${index}`}
            card={card}
            variant="hand"
            setHoveredCard={setHoveredCard}
          />
        ))}
      </div>
    </div>
  );
}

function deepClone(value) {
  return structuredClone(value);
}

function getPathParts(path) {
  return path.split(".");
}

function setByPath(obj, path, value) {
  const keys = getPathParts(path);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i += 1) {
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

function getByPath(obj, path) {
  const keys = getPathParts(path);
  let current = obj;

  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }

  return current;
}

function applyEffect(state, effect) {
  if (!effect?.type) return;

  switch (effect.type) {
    case "remove_card": {
      const zone = getByPath(state, effect.target);
      if (Array.isArray(zone) && effect.index >= 0 && effect.index < zone.length) {
        zone.splice(effect.index, 1);
      }
      break;
    }

    case "move_card_hand_to_board": {
      const player = state[effect.player];
      if (!player) break;

      const [card] = player.hand.splice(effect.handIndex, 1);
      if (card) {
        player.board.push(card);
      }
      break;
    }

    case "create_token_on_board": {
      if (state[effect.player]?.board) {
        state[effect.player].board.push(effect.card);
      }
      break;
    }

    case "change_value": {
      setByPath(state, effect.path, effect.value);
      break;
    }

    default:
      break;
  }
}



function applyEffects(state, effects = []) {
  const nextState = deepClone(state);
  effects.forEach((effect) => applyEffect(nextState, effect));
  return nextState;
}

function getDisplayedPower(card) {
  const basePower = Number(card?.power || 0);
  const donBonus = (card?.attachedDon?.length || 0) * 1000;
  return basePower + donBonus;
}

function attachDonToTarget(state, donId, targetId) {
  const nextState = structuredClone(state);

  const donCard = nextState.you.don.find((don) => don.id === donId);
  if (!donCard || donCard.attachedTo !== null) {
    return nextState;
  }

  const possibleTargets = [nextState.you.leader, ...nextState.you.board];
  const target = possibleTargets.find((card) => card.instanceId === targetId);

  if (!target) {
    return nextState;
  }

  target.attachedDon = target.attachedDon || [];
  target.attachedDon.push(donId);
  donCard.attachedTo = targetId;

  return nextState;
}

function App() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scenarioList, setScenarioList] = useState([]);
  const [scenarioId, setScenarioId] = useState(1);
  const [scenario, setScenario] = useState(null);
  const [selectedDonId, setSelectedDonId] = useState(null);
  const [playState, setPlayState] = useState(null);
  const [currentStepId, setCurrentStepId] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:3000/scenarios")
      .then((res) => setScenarioList(res.data))
      .catch((err) => console.error("Error fetching scenarios:", err));
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/scenario/${scenarioId}`)
      .then((res) => {
        const loadedScenario = res.data;
        setScenario(loadedScenario);
        setPlayState(deepClone(loadedScenario.initialState));
        setCurrentStepId(loadedScenario.steps[0]?.id ?? null);
        setHistory([]);
        setMessage("");
      })
      .catch((err) => console.error("Error fetching scenario:", err));
  }, [scenarioId]);

  const currentStep = useMemo(() => {
    if (!scenario || !currentStepId) return null;
    return scenario.steps.find((step) => step.id === currentStepId) || null;
  }, [scenario, currentStepId]);

  const chooseOption = (option) => {
    if (!playState) return;

    const nextState = applyEffects(playState, option.effects || []);
    setPlayState(nextState);
    setHistory((prev) => [...prev, option.label]);
    setCurrentStepId(option.nextStepId || null);
    setMessage(option.feedback || "");
  };

  const resetScenario = () => {
    if (!scenario) return;
    setPlayState(deepClone(scenario.initialState));
    setCurrentStepId(scenario.steps[0]?.id ?? null);
    setHistory([]);
    setMessage("");
  };

  const handleDonClick = (donId) => {
    setSelectedDonId((prev) => (prev === donId ? null : donId));
  };

  const handleAttachTargetClick = (card) => {
    if (!selectedDonId || !card?.instanceId) return;

    setPlayState((prev) => attachDonToTarget(prev, selectedDonId, card.instanceId));
    setSelectedDonId(null);
  };

  if (!scenario || !playState || !currentStep) {
    return <div className="app-shell">Loading...</div>;
  }

  const isFinished = currentStep.result === "win" || currentStep.result === "fail";

  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper">
          <OpponentBoard data={playState.opponent} setHoveredCard={setHoveredCard} />
          <PlayerBoard
  data={playState.you}
  setHoveredCard={setHoveredCard}
  selectedDonId={selectedDonId}
  onDonClick={handleDonClick}
  onAttachTargetClick={handleAttachTargetClick}
/>
        </main>

        {hoveredCard && (
          <div className="center-preview">
            <img src={hoveredCard.image} alt={hoveredCard.name} />
          </div>
        )}

        <aside className="sidebar">
          <section className="panel">
            <h1>{scenario.title}</h1>
            <p><strong>Difficulty:</strong> {scenario.difficulty}</p>
            <p><strong>Scenario ID:</strong> {scenario.id}</p>
          </section>

          <section className="panel">
            <h2>Navigation</h2>
            <div className="button-stack">
              <button
                onClick={() => setScenarioId((prev) => Math.max(prev - 1, 1))}
                disabled={scenarioId === 1}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setScenarioId((prev) => Math.min(prev + 1, scenarioList.length))
                }
                disabled={scenarioId === scenarioList.length}
              >
                Next
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Current Step</h2>
            <p>{currentStep.prompt}</p>

            {!isFinished ? (
              <div className="action-list">
                {currentStep.options.map((option, index) => (
                  <button
                    key={index}
                    className="full-button"
                    onClick={() => chooseOption(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`result-box ${currentStep.result === "win" ? "correct" : "wrong"}`}>
                {currentStep.result === "win" ? "You solved it." : "Wrong line."}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Chosen Actions</h2>
            {history.length === 0 ? (
              <p>No actions selected yet.</p>
            ) : (
              <ol className="sequence-list">
                {history.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}

            <div className="action-list">
              <button onClick={resetScenario}>Reset Scenario</button>
            </div>
          </section>

          {message && (
            <section className="panel">
              <h2>Feedback</h2>
              <p>{message}</p>
            </section>
          )}

          <section className="panel">
            <h2>Scenario List</h2>
            <div className="scenario-links">
              {scenarioList.map((item) => (
                <button
                  key={item.id}
                  className={`scenario-link ${item.id === scenarioId ? "active" : ""}`}
                  onClick={() => setScenarioId(item.id)}
                >
                  #{item.id} - {item.title}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default App;