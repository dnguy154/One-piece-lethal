const express = require("express");
const cors = require("cors");
const scenarios = require("./scenarios");
const dailyChallenges = require("./dailyChallenges");
const { hydrateScenario, fetchCard } = require("./cardService");
const challenges = require("./challenges");

const app = express();
app.set("trust proxy", 1);

const rateLimit = require("express-rate-limit");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  // Player frontend
  "https://one-piece-lethal.vercel.app",

  // Builder frontend - update this if your builder Vercel URL is different
  "https://one-piece-lethal-builder.vercel.app"
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests, Postman, direct browser visits, etc.
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        callback(null, true);
        return;
      }

      console.log("CORS blocked origin:", origin);
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

const cardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    error: "Too many card requests. Please try again later."
  }
});

app.use(generalLimiter);

app.get("/scenarios", (req, res) => {
  const summary = scenarios.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    difficulty: scenario.difficulty
  }));

  res.json(summary);
});

app.get("/scenario/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const scenario = scenarios.find((s) => s.id === id);

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    const hydrated = await hydrateScenario(scenario);
    res.json(hydrated);
  } catch (error) {
    console.error("Error hydrating scenario:", error);
    res.status(500).json({ error: "Failed to load scenario" });
  }
});

app.get("/card/:id", cardLimiter, async (req, res) => {
  try {
    const card = await fetchCard(req.params.id);
    res.json(card);
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

app.get("/debug-card/:id", async (req, res) => {
  try {
    const card = await fetchCard(req.params.id);
    res.json(card);
  } catch (error) {
    console.error("Debug card fetch failed:", error);
    res.status(500).json({ error: "Failed to fetch debug card" });
  }
});


function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getTodayChallenge() {
  const today = getTodayDateKey();

  const challenge = dailyChallenges.find(
    (dailyChallenge) => dailyChallenge.date === today
  );

  return challenge || null;
}

function findScenarioById(scenarioId) {
  return scenarios.find((scenario) => Number(scenario.id) === Number(scenarioId));
}


app.get("/challenge/today", async (req, res) => {
  try {
    const challenge = getTodayChallenge();

    if (!challenge) {
      return res.status(404).json({
        error: "No daily challenge scheduled for today"
      });
    }

    const scenario = scenarios.find((s) => s.id === challenge.scenarioId);

    if (!scenario) {
      return res.status(404).json({
        error: `Scenario ${challenge.scenarioId} not found`
      });
    }

    const hydratedScenario = await hydrateScenario(scenario);

    res.json({
      challenge: {
        id: challenge.challengeNumber,
        date: challenge.date,
        scenarioId: challenge.scenarioId,
        title: challenge.title
      },
      scenario: hydratedScenario
    });
  } catch (error) {
    console.error("Error loading daily challenge:", error);
    res.status(500).json({
      error: "Failed to load daily challenge"
    });
  }
});

app.get("/challenges", (req, res) => {
  const todayKey = getTodayDateKey();

  const visibleChallenges = challenges
    .filter((challenge) => challenge.date <= todayKey)
    .map((challenge) => ({
      id: challenge.id,
      date: challenge.date,
      scenarioId: challenge.scenarioId,
      title: challenge.title
    }));

  res.json(visibleChallenges);
});

app.get("/challenge/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const todayKey = getTodayDateKey();

    if (date > todayKey) {
      return res.status(403).json({ error: "Future challenge is locked." });
    }

    const challenge = challenges.find((entry) => entry.date === date);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const scenario = findScenarioById(challenge.scenarioId);

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found for challenge." });
    }

    const hydrated = await hydrateScenario(scenario);

    res.json({
      challenge,
      scenario: hydrated
    });
  } catch (error) {
    console.error("Error loading archive challenge:", error);
    res.status(500).json({ error: "Failed to load archive challenge." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});