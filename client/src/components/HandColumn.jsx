import CardTile from "./CardTile";

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
        <img
          src="/images/card_back.png"
          alt="Hidden hand"
          className="hand-pile-image"
        />
      ) : topCard?.image ? (
        <img
          src={topCard.image}
          alt={topCard.name}
          className="hand-pile-image"
        />
      ) : null}

      <div className="hand-count-badge">{count}</div>
      <div className="hand-pile-label">{label}</div>
    </button>
  );
}

export default function HandColumn({
  cards,
  setHoveredCard,
  onCardClick,
  selectedHandCardIndex,
  hiddenCards = false,
  label = "Hand",
  onOpenHand,
  onMobilePreview
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
              onMobilePreview={hiddenCards ? undefined : onMobilePreview}
            />
          </div>
        ))}
      </div>
    </div>
  );
}