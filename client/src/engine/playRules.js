import { isCharacterCard, isEventCard, hasRush, getCardCost } from "./cardRules";
import { canAffordCard, restDonForCost } from "./donRules";
import { addCardToTrash } from "./gameState";

export function playHandCardToState(state, handIndex, replaceTargetInstanceId = null) {
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
        : player.board.findIndex(
            (boardCard) => boardCard.instanceId === replaceTargetInstanceId
          );

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

      const attachedDonIds = Array.isArray(replacedCard?.attachedDon)
        ? replacedCard.attachedDon
        : [];

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