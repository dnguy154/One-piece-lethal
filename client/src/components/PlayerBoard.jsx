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
  onOpenHand
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

        <div className="life-column">
          <LifeStack lifeCards={data.life} setHoveredCard={setHoveredCard} />
        </div>

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
            </Zone>

            <Zone title="Stage" className="stage-zone compact-zone">
              <CardTile
                card={data.stage || null}
                variant="stage"
                setHoveredCard={setHoveredCard}
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