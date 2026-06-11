import { shouldUseHoverPreview } from "../utils/device";

export default function LifeStack({
  lifeCards,
  revealCards = false,
  setHoveredCard
}) {
  const cards = Array.isArray(lifeCards)
    ? lifeCards
    : Array.from({ length: Number(lifeCards) || 0 }).map(() => null);

  const handleMouseEnter = (card, isRevealed) => {
    if (!card || !isRevealed) return;
    if (!shouldUseHoverPreview()) return;

    setHoveredCard?.(card);
  };

  const handleMouseLeave = () => {
    if (!shouldUseHoverPreview()) return;

    setHoveredCard?.(null);
  };

  return (
    <div className="life-stack">
      {cards.map((card, index) => {
        const isFaceUp = !!card?.faceUp || !!card?.isFaceUp;
        const shouldReveal = revealCards || isFaceUp;

        const imageSrc =
          shouldReveal && card?.image
            ? card.image
            : "/images/card_back.png";

        return (
          <div
            key={card?.instanceId || `life-${index}`}
            className="life-card"
style={{
  top: `${index * 20}px`,
  zIndex: cards.length - index
}}
            onMouseEnter={() => handleMouseEnter(card, shouldReveal)}
            onMouseLeave={handleMouseLeave}
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