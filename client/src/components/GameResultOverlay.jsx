export default function GameResultOverlay({
  hasWon,
  hasLost,
  hasConceded
}) {
  if (hasWon) {
    return (
      <div className="game-result-overlay">
        <div className="game-result-text win">You Win</div>
      </div>
    );
  }

  if (hasLost || hasConceded) {
    return (
      <div className="game-result-overlay">
        <div className="game-result-text lose">You Lose</div>
      </div>
    );
  }

  return null;
}