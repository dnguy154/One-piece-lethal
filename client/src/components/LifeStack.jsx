import { shouldUseHoverPreview } from "../utils/device";

export default function LifeStack({
  lifeCards,
  revealCards = false,
  setHoveredCard,
  onMobilePreview,
  onMobilePreviewClose
}) {
  const cards = Array.isArray(lifeCards)
    ? lifeCards
    : Array.from({ length: Number(lifeCards) || 0 }).map(() => null);

  const handleMouseEnter = (card, isRevealed) => {
    if (!card || !isRevealed) return;
    if (!shouldUseHoverPreview()) return;

console.log("Hovering life card:", card);
setHoveredCard?.(card);
  };

  const handleMouseLeave = () => {
    if (!shouldUseHoverPreview()) return;

    setHoveredCard?.(null);
  };

  return (
    <div className="life-stack">
      {cards.map((card, index) => {
        const isFaceUp =
          !!card?.faceUp || !!card?.isFaceUp || !!card?.revealed;

        const shouldReveal = revealCards || isFaceUp;

        const imageSrc =
          shouldReveal && card?.image
            ? card.image
            : "/images/card_back.png";

        return (
          <div
            key={card?.instanceId || `life-${index}`}
            className={`life-card ${shouldReveal ? "face-up-life" : "face-down-life"}`}
            style={{
              top: `${index * 20}px`,
              zIndex: cards.length - index
            }}
            onMouseEnter={() => handleMouseEnter(card, shouldReveal)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={() => {
              if (!card || !shouldReveal) return;

              setHoveredCard?.(null);
              onMobilePreview?.(card);
            }}
            onTouchEnd={() => {
              onMobilePreviewClose?.();
            }}
            onTouchCancel={() => {
              onMobilePreviewClose?.();
            }}
          >
            <img
              src={imageSrc}
              className="life-card-inner"
              alt={
                shouldReveal
                  ? card?.name || card?.cardId || "Face up life"
                  : "Life card"
              }
            />
          </div>
        );
      })}
    </div>
  );
}