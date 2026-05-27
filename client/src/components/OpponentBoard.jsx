import CardTile from "./CardTile";
import CharacterCards from "./CharacterCards";
import DonArea from "./DonArea";
import HandColumn from "./HandColumn";
import LifeStack from "./LifeStack";
import TrashPile from "./TrashPile";
import Zone from "./Zone";
import { getDisplayedPower } from "../engine/cardRules";

export default function OpponentBoard({
  data,
  setHoveredCard,
  onTargetClick,
  visibility,
  onTrashClick,
  onOpenHand,
  onMobilePreview,
  onMobilePreviewClose
}) {
  return (
    <div className="board-area opponent-board">
      <div className="board-body side-hand-layout">
        <HandColumn
          cards={data.hand}
          setHoveredCard={setHoveredCard}
          hiddenCards={!visibility.showOpponentHand}
          label="Opponent Hand"
          onOpenHand={onOpenHand}
          onMobilePreview={onMobilePreview}
        />

        <div className="life-column">
          <LifeStack
            lifeCards={data.life}
            revealCards={visibility.showOpponentLife}
            setHoveredCard={setHoveredCard}
          />
        </div>

        <div className="playmat compact-playmat opponent-flipped">
          <div className="resource-split-row compact-resource-row">
            <Zone title="DON!! Area" className="don-zone compact-zone">
              <DonArea don={data.don} selectedDonIds={[]} onDonClick={() => {}} />
            </Zone>

            <Zone title="Trash" className="trash-zone compact-zone">
              <TrashPile
                cards={data.trash}
                trashCount={data.trashCount}
                onClick={onTrashClick}
              />
            </Zone>
          </div>

          <div className="mid-row opponent-mid-row compact-mid-row">
            <Zone title="Leader" className="leader-zone compact-zone">
              <CardTile
                card={data.leader || null}
                variant="leader"
                setHoveredCard={setHoveredCard}
                onClick={onTargetClick}
                onMobilePreview={onMobilePreview}
                onMobilePreviewClose={onMobilePreviewClose}
                powerValue={getDisplayedPower(data.leader, { includeAttachedDon: false })}
                attachedDonCount={data.leader?.attachedDon?.length || 0}
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

          <Zone title="Character Area" className="character-zone">
<CharacterCards
  cards={data.board}
  setHoveredCard={setHoveredCard}
  onCardClick={onTargetClick}
  onMobilePreview={onMobilePreview}
  onMobilePreviewClose={onMobilePreviewClose}
  includeAttachedDonPower={false}
/>
          </Zone>
        </div>
      </div>
    </div>
  );
}