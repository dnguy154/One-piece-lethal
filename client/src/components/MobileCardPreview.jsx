export default function MobileCardPreview({ card, onClose }) {
  if (!card) return null;

  return (
    <div className="mobile-card-preview-overlay" onClick={onClose}>
      <div
        className="mobile-card-preview-modal"
        onClick={(event) => event.stopPropagation()}
      >
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
          className="mobile-card-preview-image"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    </div>
  );
}