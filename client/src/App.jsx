import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ScenarioBuilder from "./ScenarioBuilder";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const SHOW_BUILDER = false;

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

  if (hidden) {
    return (
      <div className={`${className} real-card-back`}>
        <img src="/images/card_back.png" alt="Hidden card" className="card-image" />
      </div>
    );
  }
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
      {card.image ? (
        <img src={card.image} alt={card.name} className="card-image" />
      ) : (
        <div className="card-missing-image">
          {card.name || card.cardId || "Missing Card"}
        </div>
      )}
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
          className={`don-stack-item ${selectedDonIds.includes(donCard.id) ? "selected-don" : ""} ${donCard.rested ? "disabled-don" : ""}`}
          style={{
            left: `calc(15px + ${index} * min(25px, (100% - var(--don-card-w) - 12px) / 9))`,
            zIndex: index + 1
          }}
          onClick={() => {
            if (donCard.attachedTo === null && !donCard.rested) {
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


function LifeStack({ lifeCards, revealCards = false, setHoveredCard }) {
  const count = Array.isArray(lifeCards) ? lifeCards.length : Number(lifeCards) || 0;
  const cards = Array.isArray(lifeCards) ? lifeCards : Array.from({ length: count });

  return (
    <div className="life-stack">
      {cards.map((card, index) => {
        const canReveal = revealCards && card?.image;

        return (
          <div
            key={card?.instanceId || index}
            className="life-card"
            style={{
              top: `${index * 20}px`,
              zIndex: index + 1
            }}
            onMouseEnter={() => {
              if (canReveal) setHoveredCard?.(card);
            }}
            onMouseLeave={() => {
              if (canReveal) setHoveredCard?.(null);
            }}
          >
            {canReveal ? (
              <img src={card.image} className="life-card-inner" alt={card.name} />
            ) : (
              <img src="/images/card_back.png" className="life-card-inner" alt="Life card" />
            )}
          </div>
        );
      })}
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
  onEmptySlotClick,
  disableHoverPreview = false
}) {
  const slots = Array.from({ length: 5 }, (_, index) => cards[index] || null);

  return (
    <div className="character-cards">
      {slots.map((card, index) => (
        <div
          key={card?.instanceId || `slot-${index}`}
          className={`character-slot ${!card ? "empty-slot" : ""}`}
          onClick={() => {
            if (!card) {
              onEmptySlotClick?.(index);
            }
          }}
        >
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

function HandPileButton({ cards = [], hiddenCards = false, label, onClick }) {
  const count = cards?.length || 0;
  const topCard = cards?.[count - 1];

  return (
    <button
      type="button"
      className="hand-pile-button"
      onClick={onClick}
      disabled={count === 0}
    >
      {hiddenCards ? (
        <img src="/images/card_back.png" alt="Hidden hand" className="hand-pile-image" />
      ) : topCard?.image ? (
        <img src={topCard.image} alt={topCard.name} className="hand-pile-image" />
      ) : null}

      <div className="hand-count-badge">{count}</div>
      <div className="hand-pile-label">{label}</div>
    </button>
  );
}

function HandViewerModal({
  title,
  cards = [],
  hiddenCards = false,
  onClose,
  setHoveredCard,
  onCardClick,
  selectedHandCardIndex
}) {
  return (
    <div className="hand-modal-overlay" onClick={onClose}>
      <div className="hand-modal" onClick={(event) => event.stopPropagation()}>
        <div className="hand-modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            X
          </button>
        </div>

        {cards.length === 0 ? (
          <p>No cards in hand.</p>
        ) : (
          <div className="hand-modal-grid">
            {cards.map((card, index) => (
              <div
                key={`${card.id || card.name}-${index}`}
                className={selectedHandCardIndex === index ? "selected-hand-card" : ""}
              >
                <CardTile
                  card={card}
                  hidden={hiddenCards}
                  variant="hand"
                  setHoveredCard={hiddenCards ? undefined : setHoveredCard}
                  onClick={hiddenCards ? undefined : () => onCardClick?.(card, index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HandColumn({
  cards,
  setHoveredCard,
  onCardClick,
  selectedHandCardIndex,
  hiddenCards = false,
  label = "Hand",
  onOpenHand
}) {
  return (
    <div className="hand-column">
      <div className="hand-mobile-collapsed">
        <HandPileButton
          cards={cards}
          hiddenCards={hiddenCards}
          label={label}
          onClick={onOpenHand}
        />
      </div>

      <div className="hand-strip side-hand-horizontal hand-desktop-expanded">
        {cards?.map((card, index) => (
          <div
            key={`${card.id || card.name}-${index}`}
            className={selectedHandCardIndex === index ? "selected-hand-card" : ""}
          >
            <CardTile
              card={card}
              hidden={hiddenCards}
              variant="hand"
              setHoveredCard={hiddenCards ? undefined : setHoveredCard}
              onClick={hiddenCards ? undefined : () => onCardClick?.(card, index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrashPile({ cards = [], trashCount = 0, onClick }) {
  const actualCards = Array.isArray(cards) ? cards : [];
  const lastCard = actualCards[actualCards.length - 1];

  return (
    <button
      type="button"
      className="trash-pile-button"
      onClick={onClick}
      disabled={actualCards.length === 0 && Number(trashCount || 0) === 0}
    >
      {lastCard?.image ? (
        <img src={lastCard.image} alt={lastCard.name} className="trash-card-image" />
      ) : null}

      {(actualCards.length || trashCount || 0) > 0 && (
        <div className="trash-count-badge">
          {actualCards.length || trashCount || 0}
        </div>
      )}
    </button>
  );
}

function TrashViewerModal({ title, cards = [], onClose, setHoveredCard }) {
  return (
    <div className="trash-modal-overlay" onClick={onClose}>
      <div className="trash-modal" onClick={(event) => event.stopPropagation()}>
        <div className="trash-modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            X
          </button>
        </div>

        {cards.length === 0 ? (
          <p>No cards in trash.</p>
        ) : (
          <div className="trash-modal-grid">
            {cards.map((card, index) => (
              <CardTile
                key={`${card.instanceId || card.id || card.name}-${index}`}
                card={card}
                variant="hand"
                setHoveredCard={setHoveredCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OpponentBoard({
  data,
  setHoveredCard,
  onTargetClick,
  visibility,
  onTrashClick,
  onOpenHand
}) {
  return (
    <div className="board-area opponent-board">
      <div className="board-body side-hand-layout">
        <HandColumn
          cards={data.hand}
          setHoveredCard={setHoveredCard}
          hiddenCards={!visibility.showOpponentHand}
          label="Opponent Hand"
          onOpenHand={onOpenHand}
        />

        <div className="life-column">
          <LifeStack
            lifeCards={data.life}
            revealCards={visibility.showOpponentLife}
            setHoveredCard={setHoveredCard}
          />
        </div>

        <div className="playmat compact-playmat opponent-flipped">
          <div className="resource-split-row compact-resource-row">
            <Zone title="DON!! Area" className="don-zone compact-zone">
              <DonArea don={data.don} selectedDonIds={[]} onDonClick={() => { }} />
            </Zone>

            <Zone title="Trash" className="trash-zone compact-zone">
              <TrashPile
                cards={data.trash}
                trashCount={data.trashCount}
                onClick={onTrashClick}
              />
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
  onAttachTargetClick,
  onHandCardClick,
  onEmptyCharacterSlotClick,
  selectedHandCardIndex,
  onTrashClick,
  onOpenHand
}) {
  return (
    <div className="board-area player-board">
      <div className="board-body side-hand-layout">
        <HandColumn
          cards={data.hand}
          setHoveredCard={setHoveredCard}
          onCardClick={onHandCardClick}
          selectedHandCardIndex={selectedHandCardIndex}
          label="Your Hand"
          onOpenHand={onOpenHand}
        />

        <div className="life-column">
          <LifeStack lifeCards={data.life} setHoveredCard={setHoveredCard} />
        </div>

        <div className="playmat compact-playmat">
          <Zone title="Character Area" className="character-zone">
            <CharacterCards
              cards={data.board}
              setHoveredCard={setHoveredCard}
              onCardClick={onAttachTargetClick}
              onEmptySlotClick={onEmptyCharacterSlotClick}
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
              <TrashPile
                cards={data.trash}
                trashCount={data.trashCount}
                onClick={onTrashClick}
              />
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


function getDisplayedPower(card) {
  const basePower = Number(card?.power || 0);
  const donBonus = (card?.attachedDon?.length || 0) * 1000;
  return basePower + donBonus;
}

function getCardCost(card) {
  return Number(card?.cost || 0);
}

function isEventCard(card) {
  return String(card?.type || "").toLowerCase().includes("event");
}

function isCharacterCard(card) {
  const type = String(card?.type || "").toLowerCase();
  return type.includes("character");
}

function hasRush(card) {
  const effectText = String(card?.effect || "").toLowerCase();
  const rawText = String(card?.raw?.card_text || "").toLowerCase();

  return effectText.includes("rush") || rawText.includes("rush");
}

function canAttack(card) {
  if (!card) return false;
  if (card.rested) return false;

  if (card.summoningSick && !hasRush(card)) {
    return false;
  }

  return true;
}

function getAvailableUnattachedActiveDon(don = []) {
  return don.filter((donCard) => !donCard.rested && donCard.attachedTo === null);
}

function canAffordCard(playerState, card) {
  const cost = getCardCost(card);
  const availableDon = getAvailableUnattachedActiveDon(playerState?.don || []);
  return availableDon.length >= cost;
}

function restDonForCost(playerState, cost) {
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
function addCardToTrash(playerState, card) {
  if (!playerState || !card) return;

  playerState.trash = playerState.trash || [];

  playerState.trash.push({
    ...card,
    attachedDon: []
  });

  playerState.trashCount = playerState.trash.length;
}

function addCardsToTrash(playerState, cards = []) {
  cards.forEach((card) => addCardToTrash(playerState, card));
}

function playHandCardToState(state, handIndex, replaceTargetInstanceId = null) {
  const nextState = structuredClone(state);
  const player = nextState.you;

  if (!player) {
    return { nextState, success: false, message: "Player state not found." };
  }

  if (handIndex == null || handIndex < 0 || handIndex >= player.hand.length) {
    return { nextState, success: false, message: "That card is no longer in hand." };
  }

  const card = player.hand[handIndex];
  const cost = getCardCost(card);

  if (!canAffordCard(player, card)) {
    return {
      nextState,
      success: false,
      message: `Not enough active DON to play ${card.name}.`
    };
  }

  if (isCharacterCard(card)) {
    const boardCount = player.board?.length || 0;
    const replaceIndex =
      replaceTargetInstanceId == null
        ? -1
        : player.board.findIndex((boardCard) => boardCard.instanceId === replaceTargetInstanceId);

    const isReplacing = replaceIndex !== -1;

    if (isReplacing && boardCount < 5) {
      return {
        nextState,
        success: false,
        message: "You can only replace a character when your board has 5 characters."
      };
    }

    if (!isReplacing && boardCount >= 5) {
      return {
        nextState,
        success: false,
        message: "Your character area is full. Select one of your characters to replace."
      };
    }

    const paid = restDonForCost(player, cost);

    if (!paid) {
      return {
        nextState,
        success: false,
        message: `Not enough active DON to play ${card.name}.`
      };
    }

    const [playedCard] = player.hand.splice(handIndex, 1);

    const newCharacter = {
      ...playedCard,
      instanceId: `you-board-${Date.now()}-${player.board.length + 1}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      attachedDon: [],
      rested: false,
      summoningSick: !hasRush(playedCard)
    };

    if (isReplacing) {
      const replacedCard = player.board[replaceIndex];
      const attachedDonIds = Array.isArray(replacedCard?.attachedDon) ? replacedCard.attachedDon : [];

      attachedDonIds.forEach((donId) => {
        const donCard = player.don.find((don) => don.id === donId);
        if (donCard) {
          donCard.attachedTo = null;
          donCard.rested = true;
        }
      });
      addCardToTrash(player, replacedCard);

      player.board[replaceIndex] = newCharacter;

      return {
        nextState,
        success: true,
        message: `${newCharacter.name} replaced ${replacedCard.name}. Attached DON returned rested.`
      };
    }

    player.board.push(newCharacter);

    return {
      nextState,
      success: true,
      message: `${card.name} was played to the character area.`
    };
  }

  if (isEventCard(card)) {
    const paid = restDonForCost(player, cost);

    if (!paid) {
      return {
        nextState,
        success: false,
        message: `Not enough active DON to play ${card.name}.`
      };
    }
    const [playedEvent] = player.hand.splice(handIndex, 1);
    addCardToTrash(player, playedEvent);

    return {
      nextState,
      success: true,
      message: `${card.name} was played and sent to the trash.`
    };
  }

  return {
    nextState,
    success: false,
    message: `${card.name} cannot be played with the current rules yet.`
  };
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


function canAttackCharacterTarget(attacker, target) {
  if (!target) return false;

  if (target.rested) return true;

  return !!attacker?.canAttackActiveCharacters;
}

// ==============================
// COMBAT + FULL MINIMAX DEFENSE AI
// ==============================

// Limit search depth so the AI cannot accidentally recurse forever.
// 8 is enough for most lethal puzzles because there are usually 3-6 attacks max.
const MAX_MINIMAX_DEPTH = 10;

function getCounterValue(card) {
  return Number(card?.counter || 0);
}

// Finds the smallest total counter package that reaches the needed amount.
// Example: if opponent needs 3000 counter, this tries to avoid wasting a 4000+ amount if smaller works.
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

function getAvailableBlockers(board = []) {
  return board.filter((card) => canUseBlocker(card));
}

function getAvailableAttachableDonIds(state) {
  return (state.you.don || [])
    .filter((donCard) => !donCard.rested && donCard.attachedTo === null)
    .map((donCard) => donCard.id);
}

function attachDonForSimulation(state, targetInstanceId, amount) {
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

function getDefenseTypePriority(type, context = {}) {
  const {
    attackerPower = 0,
    targetPower = 0,
    counterUsed = 0,
    lifeBefore = 0,
    lifeAfter = 0
  } = context;

  const neededCounter = Math.max(0, attackerPower - targetPower + 1000);

  switch (type) {
    case "take_life": {
      let score = 0;

      // Small swings can be countered cheaply if hand exists.
      if (neededCounter <= 2000) {
        score -= 50000;
      } else if (neededCounter <= 3000) {
        score += 50000;
      } else if (neededCounter <= 4000) {
        score += 200000;
      } else {
        score += 500000;
      }

      // Taking life while life exists is usually correct.
      if (lifeBefore > 0) {
        score += 600000;
      }

      // Going to 0 is dangerous, but not worse than wasting blocker too early.
      if (lifeAfter === 0) {
        score -= 75000;
      }

      return score;
    }

    case "counter": {
      // Cheap counter is okay, expensive counter is bad.
      return 220000 - counterUsed * 80;
    }

    case "block_survive":
      // Blocking while still having life should be discouraged.
      if (lifeBefore > 0) return -300000;
      return 180000;

    case "block_ko":
      // Losing blocker while still having life is very bad.
      if (lifeBefore > 0) return -450000;
      return 100000;

    case "block_counter_save":
      if (lifeBefore > 0) return -500000 - counterUsed * 80;
      return 50000 - counterUsed * 80;

    case "no_defense_needed":
      return 900000;

    case "character_survived":
      return 850000;

    case "character_ko":
      return 600000;

    case "lose":
      return -9999999;

    default:
      return 0;
  }
}

function scoreDefenseChoice(nextState, defenseOption, context = {}) {
  const lifeBefore = context.lifeBefore ?? 0;
  const lifeAfter = getLifeCount(nextState.opponent.life);

  return (
    scoreOpponentState(nextState) +
    getDefenseTypePriority(defenseOption.type, {
      ...context,
      counterUsed: defenseOption.counterUsed || 0,
      lifeBefore,
      lifeAfter
    })
  );
}

// This gives the AI a fallback score when both lines survive or both lines lose.
// Higher score = better for opponent.
function scoreOpponentState(state) {
  if (state.opponent?.defeated) {
    return -999999999;
  }

  const life = getLifeCount(state.opponent.life);

  const totalCounter = (state.opponent.hand || []).reduce(
    (total, card) => total + getCounterValue(card),
    0
  );

  const activeBlockers = (state.opponent.board || []).filter(canUseBlocker).length;

  const remainingAttackers = generatePossibleAttacks(state).length;

  let score = 0;

  // Life is the most valuable resource.
  score += life * 100000;

  // Blockers are very valuable because they can stop lethal.
  score += activeBlockers * 25000;

  // Counter is useful, but less important than life/blockers.
  score += totalCounter * 3;

  // If opponent has 0 life and player still has attacks, this is dangerous.
  if (life === 0 && remainingAttackers > 0) {
    score -= 75000;
  }

  return score;
}

// All possible player attacks from the current board.
// The player is assumed to choose the best attack order to force lethal.
function generatePossibleAttacks(state) {
  const attacks = [];
  const availableDonCount = getAvailableAttachableDonIds(state).length;

  const addAttacksForCard = (attacker) => {
    if (!canAttack(attacker)) return;

    // Simulate attacking with 0 DON attached, 1 DON attached, 2 DON attached, etc.
    // This lets minimax understand future lethal lines that require DON attachments.
    for (let donToAttach = 0; donToAttach <= availableDonCount; donToAttach += 1) {
      const attackState = attachDonForSimulation(
        state,
        attacker.instanceId,
        donToAttach
      );

      const simulatedAttackerRef = findCardByInstanceId(
        attackState,
        attacker.instanceId
      );

      if (!simulatedAttackerRef || !canAttack(simulatedAttackerRef.card)) {
        continue;
      }

      if (attackState.opponent.leader?.instanceId) {
        attacks.push({
          stateBeforeAttack: attackState,
          attackerId: simulatedAttackerRef.card.instanceId,
          targetId: attackState.opponent.leader.instanceId,
          attachedDonCount: donToAttach
        });
      }

      for (const target of attackState.opponent.board || []) {
        if (target.rested || simulatedAttackerRef.card.canAttackActiveCharacters) {
          attacks.push({
            stateBeforeAttack: attackState,
            attackerId: simulatedAttackerRef.card.instanceId,
            targetId: target.instanceId,
            attachedDonCount: donToAttach
          });
        }
      }
    }
  };

  if (state.you.leader) {
    addAttacksForCard(state.you.leader);
  }

  for (const card of state.you.board || []) {
    addAttacksForCard(card);
  }

  return attacks;
}

// Applies counter cards to a specific target.
// This returns null if counter is impossible or unnecessary.
function createCounterDefenseOption(state, attackerPower, targetRef) {
  const nextState = structuredClone(state);
  const newTargetRef = findCardByInstanceId(nextState, targetRef.card.instanceId);

  if (!newTargetRef) return null;

  const targetPower = getDisplayedPower(newTargetRef.card);

  // To survive battle in OPTCG, defender must become strictly higher than attacker.
  const neededCounter = attackerPower - targetPower + 1000;

  if (neededCounter <= 0) {
    return null;
  }

  const selection = chooseMinimumCounterCards(nextState.opponent.hand, neededCounter);

  if (!selection) {
    return null;
  }

  const usedCards = selection.chosen.map((entry) => entry.card);
  const indexesToRemove = selection.chosen
    .map((entry) => entry.index)
    .sort((a, b) => b - a);

  for (const index of indexesToRemove) {
    nextState.opponent.hand.splice(index, 1);
  }

  addCardsToTrash(nextState.opponent, usedCards);

  return {
    nextState,
    message: `Opponent countered with ${usedCards.map((card) => card.name).join(", ")}.`,
    type: "counter",
    counterUsed: selection.total,
    cardsUsed: usedCards.length
  };
}

// Player attacks leader and opponent takes life.
// If opponent has no life, this means opponent loses.
function createTakeLifeDefenseOption(state) {
  const nextState = structuredClone(state);

  if (getLifeCount(nextState.opponent.life) > 0) {
    takeTopLifeToHand(nextState.opponent);

    return {
      nextState,
      message: "Opponent took 1 life into hand.",
      type: "take_life"
    };
  }

  nextState.opponent.defeated = true;

  return {
    nextState,
    message: "Opponent could not defend lethal.",
    type: "lose"
  };
}

// Blocker defense.
// This includes two versions:
// 1. Block without countering the blocker.
// 2. Block and counter to save the blocker, if possible.
function createBlockDefenseOptions(state, attackerPower) {
  const options = [];
  const blockers = getAvailableBlockers(state.opponent.board);

  for (const blocker of blockers) {
    const blockedState = structuredClone(state);
    const blockedRef = findCardByInstanceId(blockedState, blocker.instanceId);

    if (!blockedRef) continue;

    const blockedCard = blockedRef.card;
    blockedCard.rested = true;

    const blockerPower = getDisplayedPower(blockedCard);

    // Option A: block without counter.
    if (attackerPower >= blockerPower) {
      addCardToTrash(blockedState.opponent, blockedCard);

      blockedState.opponent.board = removeCardFromBoard(
        blockedState.opponent.board,
        blockedCard.instanceId
      );

      options.push({
        nextState: blockedState,
        message: `${blockedCard.name} blocked and was KO'd.`,
        type: "block_ko"
      });
    } else {
      options.push({
        nextState: blockedState,
        message: `${blockedCard.name} blocked and survived.`,
        type: "block_survive"
      });
    }

    // Option B: block and use counter to save blocker.
    // Only useful if attacker would otherwise KO the blocker.
    if (attackerPower >= blockerPower) {
      const counterSaveState = structuredClone(state);
      const counterBlockerRef = findCardByInstanceId(counterSaveState, blocker.instanceId);

      if (!counterBlockerRef) continue;

      counterBlockerRef.card.rested = true;

      const targetPower = getDisplayedPower(counterBlockerRef.card);
      const neededCounter = attackerPower - targetPower + 1000;
      const selection = chooseMinimumCounterCards(counterSaveState.opponent.hand, neededCounter);

      if (selection) {
        const usedCards = selection.chosen.map((entry) => entry.card);
        const indexesToRemove = selection.chosen
          .map((entry) => entry.index)
          .sort((a, b) => b - a);

        for (const index of indexesToRemove) {
          counterSaveState.opponent.hand.splice(index, 1);
        }

        addCardsToTrash(counterSaveState.opponent, usedCards);

        options.push({
          nextState: counterSaveState,
          message: `${blocker.name} blocked. Opponent countered with ${usedCards
            .map((card) => card.name)
            .join(", ")} to save it.`,
          type: "block_counter_save",
          counterUsed: selection.total,
          cardsUsed: usedCards.length
        });
      }
    }
  }

  return options;
}

// If player attacks an opponent character and opponent does not counter.
function createBoardBattleNoCounterOption(state, attackerPower, targetRef) {
  const nextState = structuredClone(state);
  const newTargetRef = findCardByInstanceId(nextState, targetRef.card.instanceId);

  if (!newTargetRef) return null;

  const targetPower = getDisplayedPower(newTargetRef.card);

  if (attackerPower >= targetPower) {
    addCardToTrash(nextState.opponent, newTargetRef.card);

    nextState.opponent.board = removeCardFromBoard(
      nextState.opponent.board,
      newTargetRef.card.instanceId
    );
    return {
      nextState,
      message: `${newTargetRef.card.name} was KO'd.`,
      type: "character_ko"
    };
  }

  return {
    nextState,
    message: `${newTargetRef.card.name} survived the attack.`,
    type: "character_survived"
  };
}

// Generate every legal opponent defense against the current attack.
// Minimax will choose the defense that gives opponent the best survival chance.
function generateDefenseOptions(state, attackerId, targetId) {
  const attackerRef = findCardByInstanceId(state, attackerId);
  const targetRef = findCardByInstanceId(state, targetId);

  if (!attackerRef || !targetRef) return [];

  const attacker = attackerRef.card;
  const target = targetRef.card;
  const attackerPower = getDisplayedPower(attacker);
  const targetPower = getDisplayedPower(target);

  const options = [];

  // If attacker does not have enough power, opponent needs no defense.
  if (attackerPower < targetPower) {
    const nextState = structuredClone(state);

    options.push({
      nextState,
      message: `${target.name} survived because the attacker did not have enough power.`,
      type: "no_defense_needed"
    });

    return options;
  }

  // Counter is legal against both leader and character attacks.
  const counterOption = createCounterDefenseOption(state, attackerPower, targetRef);
  if (counterOption) {
    options.push(counterOption);
  }

  // Leader attacks can be taken as life, blocked, or lost if no life remains.
  if (targetRef.zone === "leader") {
    options.push(createTakeLifeDefenseOption(state));

    const blockOptions = createBlockDefenseOptions(state, attackerPower);
    options.push(...blockOptions);
  }

  // Character attacks can be accepted, meaning the character may be KO'd.
  if (targetRef.zone === "board") {
    const boardBattleOption = createBoardBattleNoCounterOption(state, attackerPower, targetRef);

    if (boardBattleOption) {
      options.push(boardBattleOption);
    }
  }

  return options;
}

// Applies an attack + a chosen defense option.
// The attacker becomes rested after the attack.
function applyAttackWithDefense(state, attackerId, defenseOption) {
  const nextState = structuredClone(defenseOption.nextState);
  const attackerRef = findCardByInstanceId(nextState, attackerId);

  if (attackerRef) {
    attackerRef.card.rested = true;
  }

  return nextState;
}

// Minimax: player tries to force win.
// Returns true if the player can force lethal from this state.
function playerCanForceWin(state, depth = 0) {
  if (state.opponent?.defeated) {
    return true;
  }

  if (depth >= MAX_MINIMAX_DEPTH) {
    return false;
  }

  const attacks = generatePossibleAttacks(state);

  if (attacks.length === 0) {
    return false;
  }

  // Player only needs one attack line that wins despite optimal opponent defense.
  for (const attack of attacks) {
    const defenseResult = chooseBestOpponentDefense(
      attack.stateBeforeAttack,
      attack.attackerId,
      attack.targetId,
      depth
    );

    if (defenseResult.playerStillForcesWin) {
      return true;
    }
  }

  return false;
}

// Minimax: opponent tries to survive.
// Opponent picks a defense where player cannot force win if one exists.
function chooseBestOpponentDefense(state, attackerId, targetId, depth = 0) {
  const defenseOptions = generateDefenseOptions(state, attackerId, targetId);

  const attackerRef = findCardByInstanceId(state, attackerId);
  const targetRef = findCardByInstanceId(state, targetId);

  const attackerPower = getDisplayedPower(attackerRef?.card);
  const targetPower = getDisplayedPower(targetRef?.card);

  const scoreContext = {
    attackerPower,
    targetPower,
    lifeBefore: getLifeCount(state.opponent.life)
  };

  if (defenseOptions.length === 0) {
    return {
      nextState: state,
      message: "No legal defense found.",
      playerStillForcesWin: false
    };
  }

  const isLeaderAttack = targetRef?.zone === "leader";
  const opponentLife = getLifeCount(state.opponent.life);

  /*
    Important defensive rule:

    If this is a leader attack and opponent still has life,
    check "take life" before blocker/counter.

    Reason:
    - Blocking while life remains gives the player free information.
    - Taking life may add counter to hand.
    - Blockers should usually be saved for when life is 0.
  */
  if (isLeaderAttack && opponentLife > 0) {
    const takeLifeOption = defenseOptions.find(
      (option) => option.type === "take_life"
    );

    if (takeLifeOption) {
      const takeLifeState = applyAttackWithDefense(
        state,
        attackerId,
        takeLifeOption
      );

      const playerStillForcesWinAfterTaking = playerCanForceWin(
        takeLifeState,
        depth + 1
      );

      // If taking life survives, always take life.
      if (!playerStillForcesWinAfterTaking) {
        return {
          nextState: takeLifeState,
          message: takeLifeOption.message,
          playerStillForcesWin: false
        };
      }
    }
  }

  let bestLosingOption = null;
  let bestLosingScore = -Infinity;

  let bestSurvivingOption = null;
  let bestSurvivingScore = -Infinity;

  for (const defenseOption of defenseOptions) {
    const nextState = applyAttackWithDefense(state, attackerId, defenseOption);
    const playerStillForcesWin = playerCanForceWin(nextState, depth + 1);

    if (!playerStillForcesWin) {
      const score = scoreDefenseChoice(nextState, defenseOption, scoreContext);

      if (score > bestSurvivingScore) {
        bestSurvivingScore = score;
        bestSurvivingOption = {
          nextState,
          message: defenseOption.message,
          playerStillForcesWin: false
        };
      }

      continue;
    }

    /*
      If all options still lose, prefer the line that gives away the least information.
      Taking life is still better than wasting/revealing blocker if life exists.
    */
    const losingScore = scoreDefenseChoice(nextState, defenseOption, scoreContext);

    if (losingScore > bestLosingScore) {
      bestLosingScore = losingScore;
      bestLosingOption = {
        nextState,
        message: defenseOption.message,
        playerStillForcesWin: true
      };
    }
  }

  return bestSurvivingOption || bestLosingOption;
}

// This is the function your UI calls when the player clicks attacker then target.
function resolveAttack(state, attackerId, targetId, scenario) {
  const nextState = structuredClone(state);

  const attackerRef = findCardByInstanceId(nextState, attackerId);
  const targetRef = findCardByInstanceId(nextState, targetId);

  if (!attackerRef || !targetRef) {
    return { nextState, resultMessage: "Invalid attack target." };
  }

  const attacker = attackerRef.card;
  const target = targetRef.card;

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

  const defenseResult = chooseBestOpponentDefense(
    nextState,
    attackerId,
    targetId,
    0
  );

  return {
    nextState: defenseResult.nextState,
    resultMessage: defenseResult.message
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
  const [scenario, setScenario] = useState(null);
  const [playState, setPlayState] = useState(null);

  const [selectedDonIds, setSelectedDonIds] = useState([]);
  const [selectedHandCardIndex, setSelectedHandCardIndex] = useState(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [actionMode, setActionMode] = useState("idle");

  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [hasWon, setHasWon] = useState(false);
  const [hasConceded, setHasConceded] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [difficultyMode, setDifficultyMode] = useState("hard");
  const [trashViewer, setTrashViewer] = useState(null);
  const [handViewer, setHandViewer] = useState(null);

  useEffect(() => {
    if (SHOW_BUILDER) return;

    axios.get(`${API_BASE_URL}/scenario/1`)
      .then((res) => {
        const loadedScenario = res.data;

        setScenario(loadedScenario);
        setPlayState(deepClone(loadedScenario.initialState));

        setSelectedDonIds([]);
        setSelectedHandCardIndex(null);
        setSelectedAttackerId(null);
        setActionMode("idle");

        setMessage("");
        setLoadError("");
        setHoveredCard(null);
        setHasWon(false);
        setHasConceded(false);
      })
      .catch((err) => {
        console.error("Error fetching scenario:", err);

        const errorData = err.response?.data;

        const errorMessage =
          typeof errorData === "string"
            ? errorData
            : errorData?.message ||
            errorData?.error ||
            err.message ||
            "Failed to load scenario.";

        setLoadError(errorMessage);
      });
  }, []);

  const openHandViewer = (side) => {
    setHandViewer({
      side,
      title: side === "you" ? "Your Hand" : "Opponent Hand"
    });
  };

  const closeHandViewer = () => {
    setHandViewer(null);
  };

  const openTrashViewer = (side) => {
    setTrashViewer({
      side,
      title: side === "you" ? "Your Trash" : "Opponent Trash"
    });
  };

  const closeTrashViewer = () => {
    setTrashViewer(null);
  };

  const clearSelections = () => {
    setSelectedDonIds([]);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setHandViewer(null);
    setHoveredCard(null);
  };

  const checkForNoLethal = (nextState) => {
    if (!nextState) return false;

    if (nextState.opponent?.defeated) {
      return false;
    }

    const canStillWin = playerCanForceWin(nextState, 0);

    if (!canStillWin) {
      setHasLost(true);
      setHasWon(false);
      setHasConceded(false);
      setMessage("No lethal remains. You lose.");
      return true;
    }

    return false;
  };

  const handleHandCardClick = (card, handIndex) => {
    if (hasWon || hasLost || hasConceded) return;
    if (handIndex == null || !playState) return;

    if (selectedDonIds.length > 0) {
      setMessage("Finish attaching DON first.");
      return;
    }

    if (selectedAttackerId) {
      setSelectedAttackerId(null);
    }

    if (isEventCard(card)) {
      const { nextState, success, message: resultMessage } = playHandCardToState(
        playState,
        handIndex
      );

      if (!success) {
        setMessage(resultMessage);
        setSelectedHandCardIndex(null);
        setActionMode("idle");
        return;
      }

      setPlayState(nextState);
      setSelectedHandCardIndex(null);
      setActionMode("idle");
      setHoveredCard(null);

      if (checkForNoLethal(nextState)) {
        return;
      }

      setMessage(resultMessage);
      return;
    }

    if (isCharacterCard(card)) {
      if (!canAffordCard(playState.you, card)) {
        setMessage(`Not enough active DON to play ${card.name}.`);
        return;
      }

      const nextSelectedIndex = selectedHandCardIndex === handIndex ? null : handIndex;

      setSelectedHandCardIndex(nextSelectedIndex);
      setSelectedAttackerId(null);
      setActionMode(nextSelectedIndex === null ? "idle" : "play_hand_character");

      // Close mobile hand modal after selecting a card,
      // so the user can click an empty board slot to summon.
      setHandViewer(null);

      setMessage(
        nextSelectedIndex === null
          ? ""
          : `Selected ${card.name}. Click an empty character slot to play it.`
      );
      return;
    }

    setMessage(`${card.name} cannot be played with the current rules yet.`);
  };

  const handleEmptyCharacterSlotClick = () => {
    if (hasWon || hasLost || hasConceded) return;
    if (selectedHandCardIndex == null || actionMode !== "play_hand_character" || !playState) {
      return;
    }

    const { nextState, success, message: resultMessage } = playHandCardToState(
      playState,
      selectedHandCardIndex
    );

    if (!success) {
      setMessage(resultMessage);
      return;
    }

    setPlayState(nextState);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setHoveredCard(null);
    setMessage(resultMessage);
  };

  const handleAttackerClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;
    if (!card?.instanceId || selectedDonIds.length > 0 || !playState) return;

    if (selectedHandCardIndex != null) {
      setSelectedHandCardIndex(null);
    }

    const ref = findCardByInstanceId(playState, card.instanceId);
    if (!ref || ref.side !== "you") return;

    if (!canAttack(ref.card)) {
      if (ref.card?.summoningSick && !hasRush(ref.card)) {
        setMessage(`${ref.card.name} cannot attack the turn it is played unless it has Rush.`);
        return;
      }

      setMessage("That card cannot attack.");
      return;
    }

    setSelectedAttackerId(card.instanceId);
    setActionMode("select_attack_target");
    setHoveredCard(null);
    setMessage(`Selected attacker: ${card.name}. Choose a target.`);
  };

  const handleAttachTargetClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;
    if (!card?.instanceId || !playState) return;

    if (selectedDonIds.length > 0) {
      const nextState = attachMultipleDonToTarget(
        playState,
        selectedDonIds,
        card.instanceId
      );

      setPlayState(nextState);
      setSelectedDonIds([]);
      setSelectedHandCardIndex(null);
      setSelectedAttackerId(null);
      setActionMode("idle");
      setMessage("DON attached.");
      return;

    }

    if (selectedHandCardIndex != null) {
      const isYourBoardCharacter = playState.you.board.some(
        (boardCard) => boardCard.instanceId === card.instanceId
      );

      if (!isYourBoardCharacter) {
        setMessage("You can only replace one of your own characters.");
        return;
      }

      if ((playState.you.board?.length || 0) < 5) {
        setMessage("You can only replace a character when your board has 5 characters.");
        return;
      }

      const { nextState, success, message: resultMessage } = playHandCardToState(
        playState,
        selectedHandCardIndex,
        card.instanceId
      );

      if (!success) {
        setMessage(resultMessage);
        return;
      }

      setPlayState(nextState);
      setSelectedHandCardIndex(null);
      setSelectedAttackerId(null);
      setActionMode("idle");
      setHoveredCard(null);
      setMessage(resultMessage);
      return;
    }

    handleAttackerClick(card);
  };

  const handleAttackTargetClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;
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
    clearSelections();

    if (scenarioResult.finished) {
      setHasWon(true);
      setHasLost(false);
      setHasConceded(false);
      setMessage(scenarioResult.message);
      return;
    }

    if (checkForNoLethal(nextState)) {
      return;
    }

    setMessage(resultMessage);
  };

  const handleDonClick = (donId) => {
    if (hasWon || hasLost || hasConceded) return;

    setHoveredCard(null);
    setSelectedAttackerId(null);
    setSelectedHandCardIndex(null);
    setActionMode("idle");

    setSelectedDonIds((prev) =>
      prev.includes(donId)
        ? prev.filter((id) => id !== donId)
        : [...prev, donId]
    );
  };

  const resetScenario = () => {
    if (!scenario) return;

    setPlayState(deepClone(scenario.initialState));
    clearSelections();
    setMessage("");
    setHasWon(false);
    setHasConceded(false);
    setHasLost(false);
  };

  const handleConcede = () => {
    clearSelections();
    setMessage("");
    setHasWon(false);
    setHasConceded(true);
    setHasWon(false);
  };

  if (SHOW_BUILDER) {
    return <ScenarioBuilder />;
  }

  if (loadError) {
    return (
      <div className="app-shell" style={{ color: "white", fontSize: "24px", padding: "30px" }}>
        Failed to load: {String(loadError)}
      </div>
    );
  }

  if (!scenario || !playState) {
    return (
      <div className="app-shell" style={{ color: "white", fontSize: "24px", padding: "30px" }}>
        Loading...
      </div>
    );
  }
  const visibilityByDifficulty = {
    easy: {
      showOpponentHand: true,
      showOpponentLife: true
    },
    medium: {
      showOpponentHand: true,
      showOpponentLife: false
    },
    hard: {
      showOpponentHand: false,
      showOpponentLife: false
    }
  };

  const visibility = visibilityByDifficulty[difficultyMode];

  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper">
          <OpponentBoard
            data={playState.opponent}
            setHoveredCard={setHoveredCard}
            onTargetClick={handleAttackTargetClick}
            visibility={visibility}
            onTrashClick={() => openTrashViewer("opponent")}
            onOpenHand={() => openHandViewer("opponent")}
          />
          <PlayerBoard
            data={playState.you}
            setHoveredCard={setHoveredCard}
            selectedDonIds={selectedDonIds}
            onDonClick={handleDonClick}
            onAttachTargetClick={handleAttachTargetClick}
            onHandCardClick={handleHandCardClick}
            onEmptyCharacterSlotClick={handleEmptyCharacterSlotClick}
            selectedHandCardIndex={selectedHandCardIndex}
            onTrashClick={() => openTrashViewer("you")}
            onOpenHand={() => openHandViewer("you")}
          />
        </main>

        {trashViewer && (
          <TrashViewerModal
            title={trashViewer.title}
            cards={playState?.[trashViewer.side]?.trash || []}
            onClose={closeTrashViewer}
            setHoveredCard={setHoveredCard}
          />


        )}

        {handViewer && (
          <HandViewerModal
            title={handViewer.title}
            cards={playState?.[handViewer.side]?.hand || []}
            hiddenCards={
              handViewer.side === "opponent" && !visibility.showOpponentHand
            }
            onClose={closeHandViewer}
            setHoveredCard={setHoveredCard}
            onCardClick={handViewer.side === "you" ? handleHandCardClick : undefined}
            selectedHandCardIndex={
              handViewer.side === "you" ? selectedHandCardIndex : null
            }
          />
        )}

        {hoveredCard && (
          <div className="center-preview">
            <img src={hoveredCard.image} alt={hoveredCard.name} />
          </div>
        )}

        {hasWon && (
          <div className="game-result-overlay">
            <div className="game-result-text win">You Win</div>
          </div>
        )}

        {hasLost && (
          <div className="game-result-overlay">
            <div className="game-result-text lose">You Lose</div>
          </div>
        )}

        {hasConceded && (
          <div className="game-result-overlay">
            <div className="game-result-text lose">You Lose</div>
          </div>
        )}

        {hasWon && (
          <div className="game-result-overlay">
            <div className="game-result-text win">You Win</div>
          </div>
        )}

        {hasConceded && (
          <div className="game-result-overlay">
            <div className="game-result-text lose">You Lose</div>
          </div>
        )}

        <aside className="sidebar">
          <section className="panel">
            <h1>{scenario.title}</h1>
          </section>
          <section className="panel">
            <h2>Difficulty</h2>

            <div className="difficulty-buttons">
              <button
                type="button"
                className={difficultyMode === "easy" ? "active-difficulty" : ""}
                onClick={() => setDifficultyMode("easy")}
              >
                Easy
              </button>

              <button
                type="button"
                className={difficultyMode === "medium" ? "active-difficulty" : ""}
                onClick={() => setDifficultyMode("medium")}
              >
                Medium
              </button>

              <button
                type="button"
                className={difficultyMode === "hard" ? "active-difficulty" : ""}
                onClick={() => setDifficultyMode("hard")}
              >
                Hard
              </button>
            </div>

            <p>
              {difficultyMode === "easy" && "Opponent hand and life are visible."}
              {difficultyMode === "medium" && "Opponent hand is visible. Life is hidden."}
              {difficultyMode === "hard" && "Opponent hand and life are hidden."}
            </p>
          </section>

          {message && (
            <section className="panel">
              <h2>Feedback</h2>
              <p>{message}</p>
            </section>
          )}

          <section className="panel">
            <button type="button" onClick={resetScenario}>
              Reset Scenario
            </button>

            <button type="button" onClick={handleConcede}>
              Concede
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default App;