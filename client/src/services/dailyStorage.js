export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getDifficultyPoints(difficultyMode) {
  switch (difficultyMode) {
    case "easy":
      return 100;
    case "medium":
      return 200;
    case "hard":
      return 300;
    default:
      return 100;
  }
}

export function getDailyResultKey(challenge) {
  if (!challenge?.date) return null;

  return `opLethalDailyResult:${challenge.date}`;
}

export function getSavedDailyResult(challenge) {
  const key = getDailyResultKey(challenge);

  if (!key) return null;

  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function getAllDailyResults() {
  const results = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);

    if (!key?.startsWith("opLethalDailyResult:")) continue;

    try {
      const result = JSON.parse(localStorage.getItem(key));

      if (result?.challengeDate) {
        results.push(result);
      }
    } catch {
      // Ignore broken localStorage entries.
    }
  }

  return results;
}

export function addDaysToDateKey(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

export function calculateDailyStats() {
  const results = getAllDailyResults();

  const played = results.length;

  const solvedResults = results.filter((result) => result.solved === true);
  const solved = solvedResults.length;

  const winPercent =
    played > 0 ? Math.round((solved / played) * 100) : 0;

  const totalPoints = results.reduce(
    (total, result) => total + Number(result.points || 0),
    0
  );

  const solvedDateSet = new Set(
    solvedResults
      .map((result) => result.challengeDate)
      .filter(Boolean)
  );

  const sortedSolvedDates = [...solvedDateSet].sort();

  let maxStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  for (const dateKey of sortedSolvedDates) {
    if (!previousDate) {
      runningStreak = 1;
    } else {
      const expectedNextDate = addDaysToDateKey(previousDate, 1);

      if (dateKey === expectedNextDate) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }

    maxStreak = Math.max(maxStreak, runningStreak);
    previousDate = dateKey;
  }

  // Important:
  // Current streak should be based on the latest solved challenge date,
  // not the user's current UTC/local date.
  let currentStreak = 0;

  if (sortedSolvedDates.length > 0) {
    let checkDate = sortedSolvedDates[sortedSolvedDates.length - 1];

    while (solvedDateSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = addDaysToDateKey(checkDate, -1);
    }
  }

  return {
    played,
    solved,
    winPercent,
    currentStreak,
    maxStreak,
    totalPoints
  };
}

export function saveFirstDailyResult(challenge, result) {
  const key = getDailyResultKey(challenge);

  if (!key) return null;

  const existingResult = getSavedDailyResult(challenge);

  // First result of the day is locked.
  if (existingResult) {
    return existingResult;
  }

  const finalResult = {
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    challengeDate: challenge.date,
    ...result,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(finalResult));

  return finalResult;
}