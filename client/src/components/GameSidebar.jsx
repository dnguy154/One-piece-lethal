export default function GameSidebar({
  scenario,
  isArchiveMode,
  message,

  difficultyMode,
  setDifficultyMode,

  resetScenario,
  handleConcede,

  hasStartedAction,
  hasWon,
  hasLost,
  hasConceded,

  loadTodayChallenge,
  disableLoadToday,
  disableDifficultyChange,
  selectedArchiveDate,
  loadArchiveChallenge,
  challengeList
}) {
  return (
    <aside className="sidebar">
      <section className="panel">
        <h1>
          {scenario.title}
          {isArchiveMode ? " — Archive" : ""}
        </h1>
      </section>

      {message && (
        <section className="panel">
          <h2>Feedback</h2>
          <p>{message}</p>
        </section>
      )}

      <section className="panel">
        <h2>Difficulty</h2>

        <div className="difficulty-buttons">
<button
  type="button"
  className={difficultyMode === "easy" ? "active-difficulty" : ""}
  onClick={() => setDifficultyMode("easy")}
  disabled={disableDifficultyChange}
>
  Easy
</button>

<button
  type="button"
  className={difficultyMode === "medium" ? "active-difficulty" : ""}
  onClick={() => setDifficultyMode("medium")}
  disabled={disableDifficultyChange}
>
  Medium
</button>

<button
  type="button"
  className={difficultyMode === "hard" ? "active-difficulty" : ""}
  onClick={() => setDifficultyMode("hard")}
  disabled={disableDifficultyChange}
>
  Hard
</button>
{disableDifficultyChange && (
  <p>
    Difficulty is locked after your first action.
  </p>
)}
        </div>

        <p>
          {difficultyMode === "easy" && "Opponent hand and life are visible."}
          {difficultyMode === "medium" && "Opponent hand is visible. Life is hidden."}
          {difficultyMode === "hard" && "Opponent hand and life are hidden."}
        </p>
      </section>

      <section className="panel">
        <button
          type="button"
          onClick={resetScenario}
          disabled={hasStartedAction && !hasWon && !hasLost && !hasConceded}
        >
          {hasWon || hasLost || hasConceded ? "Retry Scenario" : "Reset Scenario"}
        </button>

        <button type="button" onClick={handleConcede}>
          Concede
        </button>
      </section>

      <section className="panel">
        <h2>{isArchiveMode ? "Archive Practice" : "Daily Challenge"}</h2>

<button
  type="button"
  onClick={loadTodayChallenge}
  disabled={disableLoadToday}
>
  Load Today
</button>

        <div style={{ marginTop: "8px" }}>
          <label>Previous Scenarios</label>

          <select
            value={selectedArchiveDate}
            onChange={(e) => loadArchiveChallenge(e.target.value)}
            style={{ width: "100%", marginTop: "4px" }}
          >
            {challengeList.map((challenge) => (
              <option key={challenge.date} value={challenge.date}>
                {challenge.date} - {challenge.title}
              </option>
            ))}
          </select>
        </div>

        {isArchiveMode && (
          <p style={{ marginTop: "8px" }}>
            Practice mode. This does not affect streak, points, or daily result.
          </p>
        )}
      </section>
    </aside>
  );
}