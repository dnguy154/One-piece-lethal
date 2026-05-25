export default function LifeStack({
  lifeCards,
  revealCards = false,
  setHoveredCard
}) {
  const count = Array.isArray(lifeCards)
    ? lifeCards.length
    : Number(lifeCards) || 0;

  const cards = Array.isArray(lifeCards)
    ? lifeCards
    : Array.from({ length: count });

  return (
    <div className="life-stack">
      {cards.map((card, index) => {
        const canReveal = revealCards && card?.image;

        return (
          <div
            key={card?.instanceId || index}
            className="life-card"
            style={{
              top: `${index * 20}px`,
              zIndex: index + 1
            }}
            onMouseEnter={() => {
              if (canReveal) setHoveredCard?.(card);
            }}
            onMouseLeave={() => {
              if (canReveal) setHoveredCard?.(null);
            }}
          >
            {canReveal ? (
              <img
                src={card.image}
                className="life-card-inner"
                alt={card.name}
              />
            ) : (
              <img
                src="/images/card_back.png"
                className="life-card-inner"
                alt="Life card"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}