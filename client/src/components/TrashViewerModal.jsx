import CardTile from "./CardTile";

export default function TrashViewerModal({
  title,
  cards = [],
  onClose,
  setHoveredCard,
  onMobilePreview
}) {
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
                onMobilePreview={onMobilePreview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}