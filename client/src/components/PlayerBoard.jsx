import CardTile from "./CardTile";
import CharacterCards from "./CharacterCards";
import DonArea from "./DonArea";
import HandColumn from "./HandColumn";
import LifeStack from "./LifeStack";
import TrashPile from "./TrashPile";
import Zone from "./Zone";
import { getDisplayedPower } from "../engine/cardRules";

export default function PlayerBoard({
  data,
  setHoveredCard,
  selectedDonIds,
  onDonClick,
  onAttachTargetClick,
  onHandCardClick,
  onEmptyCharacterSlotClick,
  selectedHandCardIndex,
  onTrashClick,
  onMobilePreview,
  onMobilePreviewClose,
  onOpenHand,
  onStageClick
}) {
  return (
    <div className="board-area player-board">
      <div className="board-body side-hand-layout">
        <HandColumn
          cards={data.hand}
          setHoveredCard={setHoveredCard}
          onCardClick={onHandCardClick}
          selectedHandCardIndex={selectedHandCardIndex}
          label="Your Hand"
          onOpenHand={onOpenHand}
          onMobilePreview={onMobilePreview}
        />

        <div className="life-column" aria-hidden="true" />

        <div className="playmat compact-playmat">
          <Zone title="Character Area" className="character-zone">
            <CharacterCards
              cards={data.board}
              setHoveredCard={setHoveredCard}
              onCardClick={onAttachTargetClick}
              onEmptySlotClick={onEmptyCharacterSlotClick}
              onMobilePreview={onMobilePreview}
              onMobilePreviewClose={onMobilePreviewClose}
              disableHoverPreview={selectedDonIds.length > 0}
            />
          </Zone>

          <div className="mid-row player-mid-row compact-mid-row">
           <Zone title="Leader" className="leader-zone compact-zone">
  <div className="leader-with-life">
    <div className="leader-life-slot">
<LifeStack
  lifeCards={data.life}
  revealCards={false}
  setHoveredCard={setHoveredCard}
  onMobilePreview={onMobilePreview}
  onMobilePreviewClose={onMobilePreviewClose}
/>
    </div>

    <CardTile
      card={data.leader || null}
      variant="leader"
      setHoveredCard={setHoveredCard}
      onClick={onAttachTargetClick}
      onMobilePreview={onMobilePreview}
      onMobilePreviewClose={onMobilePreviewClose}
      powerValue={getDisplayedPower(data.leader)}
      attachedDonCount={data.leader?.attachedDon?.length || 0}
      disableHoverPreview={selectedDonIds.length > 0}
    />
  </div>
</Zone>

<Zone title="Stage" className="stage-zone compact-zone">
  <CardTile
    card={data.stage || null}
    variant="stage"
    setHoveredCard={setHoveredCard}
    onClick={onStageClick}
    onMobilePreview={onMobilePreview}
    onMobilePreviewClose={onMobilePreviewClose}
  />
</Zone>

            <Zone title="Deck" className="deck-zone compact-zone">
              <div className="deck-stack">
                <img src="/images/card_back.png" className="deck-card" alt="Deck" />
                <div className="deck-count">{data.deckCount ?? 40}</div>
              </div>
            </Zone>
          </div>

          <div className="resource-split-row compact-resource-row">
            <Zone title="DON!! Area" className="don-zone compact-zone">
              <DonArea
                don={data.don}
                selectedDonIds={selectedDonIds}
                onDonClick={onDonClick}
              />
            </Zone>

            <Zone title="Trash" className="trash-zone compact-zone">
              <TrashPile
                cards={data.trash}
                trashCount={data.trashCount}
                onClick={onTrashClick}
              />
            </Zone>
          </div>
        </div>
      </div>
    </div>
  );
}