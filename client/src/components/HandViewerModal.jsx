import CardTile from "./CardTile";

export default function HandViewerModal({
  title,
  cards = [],
  hiddenCards = false,
  onClose,
  setHoveredCard,
  onCardClick,
  selectedHandCardIndex,
  onMobilePreview
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
                  onMobilePreview={hiddenCards ? undefined : onMobilePreview}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}