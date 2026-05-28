export function deepClone(value) {
  return structuredClone(value);
}

export function findCardByInstanceId(state, instanceId) {
  const sides = ["you", "opponent"];

  for (const side of sides) {
    const player = state?.[side];

    if (!player) continue;

    if (player.leader?.instanceId === instanceId) {
      return {
        side,
        zone: "leader",
        card: player.leader
      };
    }

    if (player.stage?.instanceId === instanceId) {
      return {
        side,
        zone: "stage",
        card: player.stage
      };
    }

    const boardIndex = (player.board || []).findIndex(
      (card) => card.instanceId === instanceId
    );

    if (boardIndex !== -1) {
      return {
        side,
        zone: "board",
        index: boardIndex,
        card: player.board[boardIndex]
      };
    }
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