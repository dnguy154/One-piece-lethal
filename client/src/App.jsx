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

function HandColumn({
  cards,
  setHoveredCard,
  onCardClick,
  selectedHandCardIndex
}) {
  return (
    <div className="hand-column">
      <div className="hand-strip side-hand-horizontal">
        {cards?.map((card, index) => (
          <div
            key={`${card.id || card.name}-${index}`}
            className={selectedHandCardIndex === index ? "selected-hand-card" : ""}
          >
            <CardTile
              card={card}
              variant="hand"
              setHoveredCard={setHoveredCard}
              onClick={() => onCardClick?.(card, index)}
            />
          </div>
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
              <DonArea don={data.don} selectedDonIds={[]} onDonClick={() => { }} />
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
  onAttachTargetClick,
  onHandCardClick,
  onEmptyCharacterSlotClick,
  selectedHandCardIndex
}) {
  return (
    <div className="board-area player-board">
      <div className="board-body side-hand-layout">
        <HandColumn
          cards={data.hand}
          setHoveredCard={setHoveredCard}
          onCardClick={onHandCardClick}
          selectedHandCardIndex={selectedHandCardIndex}
        />

        <div className="life-column">
          <LifeStack lifeCards={data.life} />
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

function createPlayedCardInstance(card, playerBoardLength) {
  return {
    ...card,
    instanceId:
      card.instanceId ||
      `you-board-${Date.now()}-${playerBoardLength + 1}-${Math.random().toString(36).slice(2, 7)}`,
    attachedDon: [],
    rested: false
  };
}

function returnAttachedDonToAreaRested(player, card) {
  const attachedDonIds = Array.isArray(card?.attachedDon) ? card.attachedDon : [];

  attachedDonIds.forEach((donId) => {
    const donCard = player.don.find((don) => don.id === donId);

    if (donCard) {
      donCard.attachedTo = null;
      donCard.rested = true;
    }
  });
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

      player.trash = player.trash || [];
      player.trash.push({
        ...replacedCard,
        attachedDon: []
      });
      player.trashCount = (player.trashCount || 0) + 1;

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

    player.hand.splice(handIndex, 1);
    player.trashCount = (player.trashCount || 0) + 1;

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
  const [hasConceded, setHasConceded] = useState(false);
 const [selectedHandCardIndex, setSelectedHandCardIndex] = useState(null);

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
        setSelectedDonIds([]);
        setSelectedHandCardIndex(null);
        setSelectedAttackerId(null);
        setActionMode("idle");
        setHasConceded(false);
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

 const handleHandCardClick = (card, handIndex) => {
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
  if (!card?.instanceId || selectedDonIds.length > 0) return;

  // Clear any stale hand-play selection before trying to attack
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
  if (!card?.instanceId) return;

  if (selectedDonIds.length > 0) {
    setPlayState((prev) =>
      attachMultipleDonToTarget(prev, selectedDonIds, card.instanceId)
    );
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
  setSelectedHandCardIndex(null);
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
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setHasConceded(false);
  };

  const handleConcede = () => {
    setHasConceded(true);
    setMessage("");
    setSelectedDonIds([]);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setHoveredCard(null);
  };

  const handleDonClick = (donId) => {
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
            onHandCardClick={handleHandCardClick}
            onEmptyCharacterSlotClick={handleEmptyCharacterSlotClick}
            selectedHandCardIndex={selectedHandCardIndex}
          />
        </main>

        {hoveredCard && (
          <div className="center-preview">
            <img src={hoveredCard.image} alt={hoveredCard.name} />
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

          {message && (
            <section className="panel">
              <h2>Feedback</h2>
              <p>{message}</p>
            </section>
          )}

          <section className="panel">
            <button onClick={resetScenario}>Reset Scenario</button>
            <button onClick={handleConcede}>Concede</button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default App;