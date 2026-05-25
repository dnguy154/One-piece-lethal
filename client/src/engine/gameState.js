export function deepClone(value) {
  return structuredClone(value);
}

export function findCardByInstanceId(state, instanceId) {
  if (state.you.leader?.instanceId === instanceId) {
    return { side: "you", zone: "leader", card: state.you.leader };
  }

  const youBoardCard = state.you.board.find(
    (card) => card.instanceId === instanceId
  );

  if (youBoardCard) {
    return { side: "you", zone: "board", card: youBoardCard };
  }

  if (state.opponent.leader?.instanceId === instanceId) {
    return { side: "opponent", zone: "leader", card: state.opponent.leader };
  }

  const opponentBoardCard = state.opponent.board.find(
    (card) => card.instanceId === instanceId
  );

  if (opponentBoardCard) {
    return { side: "opponent", zone: "board", card: opponentBoardCard };
  }

  return null;
}

export function getLifeCount(life) {
  if (Array.isArray(life)) return life.length;
  return Number(life) || 0;
}

export function removeCardFromBoard(board, instanceId) {
  return board.filter((card) => card.instanceId !== instanceId);
}

export function takeTopLifeToHand(playerState) {
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

export function addCardToTrash(playerState, card) {
  if (!playerState || !card) return;

  playerState.trash = playerState.trash || [];

  playerState.trash.push({
    ...card,
    attachedDon: []
  });

  playerState.trashCount = playerState.trash.length;
}

export function addCardsToTrash(playerState, cards = []) {
  cards.forEach((card) => addCardToTrash(playerState, card));
}