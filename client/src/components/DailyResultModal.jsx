import { formatTime } from "../services/dailyStorage";

export default function DailyResultModal({
  dailyResult,
  dailyStats,
  isArchiveMode,
  isReplayAttempt,
  onClose,
  onPlayAgain
}) {
  if (!dailyResult) return null;

  const title = dailyResult.solved
    ? "Challenge Complete"
    : "Challenge Lost";

  const replayResultText = `${dailyResult.challengeTitle || "OP Lethal"}
${dailyResult.solved ? "Solved ✅" : "Lost ❌"}
Time: ${dailyResult.timeText || formatTime(dailyResult.timeSeconds || 0)}

Replay attempt.
This does not affect your daily score, streak, points, win %, or first result.`;

  const normalResultText = `${dailyResult.challengeTitle || "OP Lethal"}
${dailyResult.solved ? `Solved ✅ (${dailyStats.solved} solved)` : `Lost ❌ (${dailyStats.solved} solved)`}
Win %: ${dailyStats.winPercent}%
Time: ${dailyResult.timeText || formatTime(dailyResult.timeSeconds || 0)}
Current Streak: ${dailyStats.currentStreak}
Max Streak: ${dailyStats.maxStreak}
Total Points: ${dailyStats.totalPoints}`;

  const resultText = !isArchiveMode && isReplayAttempt
    ? replayResultText
    : normalResultText;

  return (
    <div className="daily-result-modal-overlay">
      <div className="daily-result-modal">
        <h2>{title}</h2>

        <pre className="daily-result-text">{resultText}</pre>

        {isArchiveMode ? (
          <p className="daily-result-note">
            Archive practice does not affect your daily streak, points, or first result.
          </p>
        ) : (
          isReplayAttempt && (
            <p className="daily-result-note">
              This replay does not affect your daily score.
            </p>
          )
        )}

        <div className="daily-result-buttons">
          <button type="button" onClick={onClose}>
            Close
          </button>

          <button type="button" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}