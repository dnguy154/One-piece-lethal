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

  return (
    <div className="daily-result-modal-overlay">
      <div className="daily-result-modal">
        <h2>
          {dailyResult.solved ? "Challenge Complete" : "Challenge Lost"}
        </h2>

        <pre className="daily-result-text">
          {`${dailyResult.challengeTitle || "OP Lethal"}
${dailyResult.solved ? `Solved ✅ (${dailyStats.solved} solved)` : `Lost ❌ (${dailyStats.solved} solved)`}
Win %: ${dailyStats.winPercent}%
Time: ${dailyResult.timeText || formatTime(dailyResult.timeSeconds || 0)}
Current Streak: ${dailyStats.currentStreak}
Max Streak: ${dailyStats.maxStreak}
Total Points: ${dailyStats.totalPoints}`}
        </pre>

        {isArchiveMode ? (
          <p className="daily-result-note">
            Archive practice does not affect your daily streak, points, or first result.
          </p>
        ) : (
          isReplayAttempt && (
            <p className="daily-result-note">
              Your first result for today is already locked. Replays will not change it.
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