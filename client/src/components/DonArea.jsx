import { DON_IMAGE } from "../constants/assets";

function DonCard({ rested = false, small = true }) {
  return (
    <div className={`don-card ${small ? "small" : ""} ${rested ? "rested" : ""}`}>
      <img src={DON_IMAGE} alt="DON!! card" className="don-image" />
    </div>
  );
}

export default function DonArea({ don, selectedDonIds, onDonClick }) {
  const donCards = Array.isArray(don)
    ? don.filter((donCard) => donCard.attachedTo === null)
    : Array.from({ length: Number(don) || 0 }, (_, index) => ({
        id: index + 1,
        rested: false,
        attachedTo: null
      }));

  return (
    <div className="don-area">
      {donCards.map((donCard, index) => (
        <div
          key={donCard.id ?? index}
          className={`don-stack-item ${
            selectedDonIds.includes(donCard.id) ? "selected-don" : ""
          } ${donCard.rested ? "disabled-don" : ""}`}
          style={{
            left: `calc(15px + ${index} * min(25px, (100% - var(--don-card-w) - 12px) / 9))`,
            zIndex: index + 1
          }}
          onClick={() => {
            if (donCard.attachedTo === null && !donCard.rested) {
              onDonClick?.(donCard.id);
            }
          }}
        >
          <DonCard rested={!!donCard.rested} small />
        </div>
      ))}
    </div>
  );
}