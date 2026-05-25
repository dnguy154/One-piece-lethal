export default function TrashPile({ cards = [], trashCount = 0, onClick }) {
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
        <img
          src={lastCard.image}
          alt={lastCard.name}
          className="trash-card-image"
        />
      ) : null}

      {(actualCards.length || trashCount || 0) > 0 && (
        <div className="trash-count-badge">
          {actualCards.length || trashCount || 0}
        </div>
      )}
    </button>
  );
}