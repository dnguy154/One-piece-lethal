import CardTile from "./CardTile";
import { getDisplayedPower } from "../engine/cardRules";

export default function CharacterCards({
  cards = [],
  setHoveredCard,
  onCardClick,
  onEmptySlotClick,
  disableHoverPreview = false,
  onMobilePreview,
  onMobilePreviewClose,
  includeAttachedDonPower = true
}) {
  const slots = Array.from({ length: 5 }, (_, index) => cards[index] || null);

  return (
    <div className="character-cards">
      {slots.map((card, index) => (
        <div
          key={card?.instanceId || `slot-${index}`}
          className={`character-slot ${!card ? "empty-slot" : ""}`}
          onClick={() => {
            if (!card) {
              onEmptySlotClick?.(index);
            }
          }}
        >
          <CardTile
            card={card}
            variant="board"
            setHoveredCard={setHoveredCard}
            onClick={card ? onCardClick : undefined}
            onMobilePreview={onMobilePreview}
            onMobilePreviewClose={onMobilePreviewClose}
powerValue={
  card
    ? getDisplayedPower(card, { includeAttachedDon: includeAttachedDonPower })
    : undefined
}
            attachedDonCount={card?.attachedDon?.length || 0}
            disableHoverPreview={disableHoverPreview}
          />
        </div>
      ))}
    </div>
  );
}