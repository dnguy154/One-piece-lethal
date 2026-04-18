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
  attachedDonCount = 0,
  disableHoverPreview = false
}) {
  const className = `card-tile ${variant} ${card?.rested ? "rested" : ""}`;

  if (hidden) return <div className={`${className} card-back`} />;
  if (!card) return <div className={`${className} card-empty`} />;

  return (
    <div
      className={className}
      onMouseEnter={() => {
        if (!disableHoverPreview) {
          setHoveredCard?.(card);
        }
      }}
      onMouseLeave={() => {
        if (!disableHoverPreview) {
          setHoveredCard?.(null);
        }
      }}
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

function DonArea({ don, selectedDonIds, onDonClick }) {
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
          className={`don-stack-item ${selectedDonIds.includes(donCard.id) ? "selected-don" : ""}`}
          style={{
            left: `calc(${index} * min(25px, (100% - var(--don-card-w)) / 9))`,
            zIndex: index + 1
          }}
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

function CharacterCards({
  cards = [],
  setHoveredCard,
  onCardClick,
  disableHoverPreview = false
}) {
  const slots = Array.from({ length: 5 }, (_, index) => cards[index] || null);

  return (
    <div className="character-cards">
      {slots.map((card, index) => (
        <div key={card?.instanceId || `slot-${index}`} className="character-slot">
          <CardTile
            card={card}
            variant="board"
            setHoveredCard={setHoveredCard}
            onClick={card ? onCardClick : undefined}
            powerValue={card ? getDisplayedPower(card) : undefined}
            attachedDonCount={card?.attachedDon?.length || 0}
            disableHoverPreview={disableHoverPreview}
          />
        </div>
      ))}
    </div>
  );
}

function HandColumn({ cards, setHoveredCard }) {
  return (
    <div className="hand-column">
      <div className="hand-strip side-hand-horizontal">
        {cards?.map((card, index) => (
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

function OpponentBoard({ data, setHoveredCard, onTargetClick }) {
  return (
    <div className="board-area opponent-board">
      <div className="board-body side-hand-layout">
        <HandColumn cards={data.hand} setHoveredCard={setHoveredCard} />

        <div className="life-column">
          <LifeStack lifeCards={data.life} />
        </div>

        <div className="playmat compact-playmat opponent-flipped">
          <div className="resource-split-row compact-resource-row">
            <Zone title="DON!! Area" className="don-zone compact-zone">
              <DonArea don={data.don} selectedDonIds={[]} onDonClick={() => {}} />
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
                setHoveredCard={setHoveredCard}
                onClick={onTargetClick}
                powerValue={getDisplayedPower(data.leader)}
                attachedDonCount={data.leader?.attachedDon?.length || 0}
              />
            </Zone>

            <Zone title="Stage" className="stage-zone compact-zone">
              <CardTile
                card={data.stage || null}
                variant="stage"
                setHoveredCard={setHoveredCard}
              />
            </Zone>

            <Zone title="Deck" className="deck-zone compact-zone">
              <div className="deck-stack">
                <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                <div className="deck-count">{data.deckCount ?? 40}</div>
              </div>
            </Zone>
          </div>

          <Zone title="Character Area" className="character-zone">
            <CharacterCards
              cards={data.board}
              setHoveredCard={setHoveredCard}
              onCardClick={onTargetClick}
            />
          </Zone>
        </div>
      </div>
    </div>
  );
}

function PlayerBoard({
  data,
  setHoveredCard,
  selectedDonIds,
  onDonClick,
  onAttachTargetClick
}) {
  return (
    <div className="board-area player-board">
      <div className="board-body side-hand-layout">
        <HandColumn cards={data.hand} setHoveredCard={setHoveredCard} />

        <div className="life-column">
          <LifeStack lifeCards={data.life} />
        </div>

        <div className="playmat compact-playmat">
          <Zone title="Character Area" className="character-zone">
            <CharacterCards
              cards={data.board}
              setHoveredCard={setHoveredCard}
              onCardClick={onAttachTargetClick}
              disableHoverPreview={selectedDonIds.length > 0}
            />
          </Zone>

          <div className="mid-row player-mid-row compact-mid-row">
            <Zone title="Leader" className="leader-zone compact-zone">
              <CardTile
                card={data.leader || null}
                variant="leader"
                setHoveredCard={setHoveredCard}
                onClick={onAttachTargetClick}
                powerValue={getDisplayedPower(data.leader)}
                attachedDonCount={data.leader?.attachedDon?.length || 0}
                disableHoverPreview={selectedDonIds.length > 0}
              />
            </Zone>

            <Zone title="Stage" className="stage-zone compact-zone">
              <CardTile
                card={data.stage || null}
                variant="stage"
                setHoveredCard={setHoveredCard}
              />
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
              <DonArea
                don={data.don}
                selectedDonIds={selectedDonIds}
                onDonClick={onDonClick}
              />
            </Zone>

            <Zone title="Trash" className="trash-zone compact-zone">
              <div className="stack-card trash-box">{data.trashCount ?? 0}</div>
            </Zone>
          </div>
        </div>
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

function attachMultipleDonToTarget(state, donIds, targetId) {
  const nextState = structuredClone(state);

  const possibleTargets = [nextState.you.leader, ...nextState.you.board];
  const target = possibleTargets.find((card) => card.instanceId === targetId);

  if (!target || !Array.isArray(donIds) || donIds.length === 0) {
    return nextState;
  }

  target.attachedDon = target.attachedDon || [];

  for (const donId of donIds) {
    const donCard = nextState.you.don.find((don) => don.id === donId);

    if (!donCard || donCard.attachedTo !== null) continue;

    target.attachedDon.push(donId);
    donCard.attachedTo = targetId;
  }

  return nextState;
}

function findCardByInstanceId(state, instanceId) {
  if (state.you.leader?.instanceId === instanceId) {
    return { side: "you", zone: "leader", card: state.you.leader };
  }

  const youBoardCard = state.you.board.find((card) => card.instanceId === instanceId);
  if (youBoardCard) {
    return { side: "you", zone: "board", card: youBoardCard };
  }

  if (state.opponent.leader?.instanceId === instanceId) {
    return { side: "opponent", zone: "leader", card: state.opponent.leader };
  }

  const opponentBoardCard = state.opponent.board.find((card) => card.instanceId === instanceId);
  if (opponentBoardCard) {
    return { side: "opponent", zone: "board", card: opponentBoardCard };
  }

  return null;
}

function canAttack(card) {
  return !!card && !card.rested;
}

function canAttackCharacterTarget(attacker, target) {
  if (!target) return false;

  if (target.rested) return true;

  return !!attacker?.canAttackActiveCharacters;
}

function getCounterValue(card) {
  return Number(card?.counter || 0);
}

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

function autoCounterFromHand(nextState, targetRef, attackerPower, scenario) {
  const aiConfig = scenario?.opponentAI?.counterFromHand;

  if (!aiConfig?.enabled) {
    return {
      defendedPower: getDisplayedPower(targetRef.card),
      usedCards: []
    };
  }

  if (targetRef.side !== "opponent") {
    return {
      defendedPower: getDisplayedPower(targetRef.card),
      usedCards: []
    };
  }

  if (
    Array.isArray(aiConfig.allowedZones) &&
    !aiConfig.allowedZones.includes(targetRef.zone)
  ) {
    return {
      defendedPower: getDisplayedPower(targetRef.card),
      usedCards: []
    };
  }

  const basePower = getDisplayedPower(targetRef.card);
  const neededPower = attackerPower - basePower + 1000;

  if (neededPower <= 0) {
    return {
      defendedPower: basePower,
      usedCards: []
    };
  }

  const selection = chooseMinimumCounterCards(nextState.opponent.hand, neededPower);

  if (!selection) {
    return {
      defendedPower: basePower,
      usedCards: []
    };
  }

  const usedCards = selection.chosen.map((entry) => entry.card);

  const indexesToRemove = selection.chosen
    .map((entry) => entry.index)
    .sort((a, b) => b - a);

  for (const index of indexesToRemove) {
    nextState.opponent.hand.splice(index, 1);
  }

  nextState.opponent.trashCount = (nextState.opponent.trashCount || 0) + usedCards.length;

  return {
    defendedPower: basePower + selection.total,
    usedCards
  };
}

function removeCardFromBoard(board, instanceId) {
  return board.filter((card) => card.instanceId !== instanceId);
}

function getLifeCount(life) {
  if (Array.isArray(life)) return life.length;
  return Number(life) || 0;
}

function takeTopLifeToHand(playerState) {
  if (Array.isArray(playerState.life)) {
    if (playerState.life.length === 0) return null;

    const takenLife = playerState.life.shift();
    if (takenLife) {
      playerState.hand.push(takenLife);
    }
    return takenLife;
  }

  const currentLife = Number(playerState.life) || 0;
  if (currentLife <= 0) return null;

  playerState.life = currentLife - 1;
  return { placeholder: true };
}

function canUseBlocker(card) {
  return !!card?.isBlocker && !card?.rested;
}

function findAvailableBlocker(board = []) {
  return board.find((card) => canUseBlocker(card)) || null;
}

function resolveAttack(state, attackerId, targetId, scenario) {
  const nextState = structuredClone(state);

  const attackerRef = findCardByInstanceId(nextState, attackerId);
  let targetRef = findCardByInstanceId(nextState, targetId);

  if (!attackerRef || !targetRef) {
    return { nextState, resultMessage: "Invalid attack target." };
  }

  const attacker = attackerRef.card;
  let target = targetRef.card;

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

  const attackerPower = getDisplayedPower(attacker);

  // Counter first
  const counterResult = autoCounterFromHand(
    nextState,
    targetRef,
    attackerPower,
    scenario
  );

  if (attackerPower < counterResult.defendedPower) {
    attacker.rested = true;

    if (counterResult.usedCards.length > 0) {
      const usedNames = counterResult.usedCards.map((card) => card.name).join(", ");
      return {
        nextState,
        resultMessage: `Opponent countered with ${usedNames} and stopped the attack.`
      };
    }

    return {
      nextState,
      resultMessage: `${attacker.name} does not have enough power to win this battle.`
    };
  }

  // If leader attack is still lethal after countering, try blocker second
  if (targetRef.zone === "leader") {
    const blockerConfig = scenario?.opponentAI?.blocker;
    const isLethalSwing = getLifeCount(nextState.opponent.life) === 0;

    if (blockerConfig?.enabled && blockerConfig?.onlyWhenLethal && isLethalSwing) {
      const blocker = findAvailableBlocker(nextState.opponent.board);

      if (blocker) {
        blocker.rested = true;
        targetRef = { side: "opponent", zone: "board", card: blocker };
        target = blocker;

        if (!canAttackCharacterTarget(attacker, target)) {
          return {
            nextState,
            resultMessage: `${blocker.name} blocked the attack, but ${attacker.name} cannot attack an active character.`
          };
        }

        const blockerCounterResult = autoCounterFromHand(
          nextState,
          targetRef,
          attackerPower,
          scenario
        );

        attacker.rested = true;

        if (attackerPower < blockerCounterResult.defendedPower) {
          if (blockerCounterResult.usedCards.length > 0) {
            const usedNames = blockerCounterResult.usedCards.map((card) => card.name).join(", ");
            return {
              nextState,
              resultMessage: `${blocker.name} blocked the attack. Opponent countered with ${usedNames} and stopped it.`
            };
          }

          return {
            nextState,
            resultMessage: `${blocker.name} blocked the attack and survived.`
          };
        }

        nextState.opponent.board = removeCardFromBoard(nextState.opponent.board, target.instanceId);
        nextState.opponent.trashCount = (nextState.opponent.trashCount || 0) + 1;

        return {
          nextState,
          resultMessage: `${blocker.name} blocked the attack, but ${attacker.name} KO'd it.`
        };
      }
    }
  }

  attacker.rested = true;

  if (targetRef.zone === "leader") {
    const currentLife = getLifeCount(nextState.opponent.life);

    if (currentLife > 0) {
      const takenLife = takeTopLifeToHand(nextState.opponent);

      return {
        nextState,
        resultMessage: takenLife
          ? `${attacker.name} attacked leader. Opponent took 1 life into hand.`
          : `${attacker.name} attacked leader for 1 life.`
      };
    }

    nextState.opponent.defeated = true;

    return {
      nextState,
      resultMessage: `${attacker.name} attacked through for game.`
    };
  }

  nextState.opponent.board = removeCardFromBoard(nextState.opponent.board, target.instanceId);
  nextState.opponent.trashCount = (nextState.opponent.trashCount || 0) + 1;

  return {
    nextState,
    resultMessage: `${attacker.name} KO'd ${target.name}.`
  };
}

function evaluateScenarioResult(state) {
  if (state.opponent?.defeated) {
    return { finished: true, result: "win", message: "You solved it." };
  }

  return { finished: false, result: null, message: "" };
}

function App() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scenarioList, setScenarioList] = useState([]);
  const [scenarioId, setScenarioId] = useState(1);
  const [scenario, setScenario] = useState(null);
  const [selectedDonIds, setSelectedDonIds] = useState([]);
  const [playState, setPlayState] = useState(null);
  const [currentStepId, setCurrentStepId] = useState(null);
  const [history, setHistory] = useState([]);
  const [actionMode, setActionMode] = useState("idle");
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
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
        setSelectedDonId(null);
        setSelectedAttackerId(null);
        setActionMode("idle");
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

  const handleAttackerClick = (card) => {
    if (!card?.instanceId || selectedDonIds.length > 0) return;

    const ref = findCardByInstanceId(playState, card.instanceId);
    if (!ref || ref.side !== "you") return;

    if (!canAttack(ref.card)) {
      setMessage("That card cannot attack.");
      return;
    }

    setSelectedAttackerId(card.instanceId);
    setActionMode("select_attack_target");
    setHoveredCard(null);
    setMessage(`Selected attacker: ${card.name}. Choose a target.`);
  };

  const handleAttachTargetClick = (card) => {
    if (!card?.instanceId) return;

if (selectedDonIds.length > 0) {
  setPlayState((prev) =>
    attachMultipleDonToTarget(prev, selectedDonIds, card.instanceId)
  );
  setSelectedDonIds([]);
  setActionMode("idle");
  return;
}

    handleAttackerClick(card);
  };

  const handleAttackTargetClick = (card) => {
    if (actionMode !== "select_attack_target" || !selectedAttackerId || !card?.instanceId) {
      return;
    }

const { nextState, resultMessage } = resolveAttack(
  playState,
  selectedAttackerId,
  card.instanceId,
  scenario
);
    const scenarioResult = evaluateScenarioResult(nextState);

    setPlayState(nextState);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setMessage(scenarioResult.finished ? scenarioResult.message : resultMessage);

    if (scenarioResult.finished) {
      setCurrentStepId("win");
    }
  };

  const resetScenario = () => {
    if (!scenario) return;
    setPlayState(deepClone(scenario.initialState));
    setCurrentStepId(scenario.steps[0]?.id ?? null);
    setHistory([]);
    setMessage("");
    setSelectedDonIds([]);
    setSelectedAttackerId(null);
    setActionMode("idle");
  };

  const handleDonClick = (donId) => {
  setHoveredCard(null);
  setSelectedAttackerId(null);
  setActionMode("idle");

  setSelectedDonIds((prev) =>
    prev.includes(donId)
      ? prev.filter((id) => id !== donId)
      : [...prev, donId]
  );
};

  if (!scenario || !playState || !currentStep) {
    return <div className="app-shell">Loading...</div>;
  }

  const isFinished = currentStep.result === "win" || currentStep.result === "fail";

  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper">
          <OpponentBoard
            data={playState.opponent}
            setHoveredCard={setHoveredCard}
            onTargetClick={handleAttackTargetClick}
          />
          <PlayerBoard
            data={playState.you}
            setHoveredCard={setHoveredCard}
            selectedDonIds={selectedDonIds}
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