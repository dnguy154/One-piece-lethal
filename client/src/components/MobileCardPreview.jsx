export default function MobileCardPreview({ card, onClose }) {
  if (!card) return null;

  return (
    <div className="mobile-card-preview-overlay">
      <div className="mobile-card-preview-modal">
        <button
          type="button"
          className="mobile-card-preview-close"
          onClick={onClose}
        >
          X
        </button>

        <img
          src={card.image}
          alt={card.name}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    </div>
  );
}