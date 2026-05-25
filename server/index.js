const express = require("express");
const cors = require("cors");
const scenarios = require("./scenarios");
const { hydrateScenario, fetchCard } = require("./cardService");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/card/:id", async (req, res) => {
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
  return new Date().toISOString().slice(0, 10);
}

function getTodayChallenge() {
  const today = getTodayDateKey();

  return {
    id: 1,
    date: today,
    scenarioId: 1,
    title: "OP Lethal #1"
  };
}

app.get("/challenge/today", async (req, res) => {
  try {
    const challenge = getTodayChallenge();

    const scenario = scenarios.find((s) => s.id === challenge.scenarioId);

    if (!scenario) {
      return res.status(404).json({
        error: "Daily challenge scenario not found"
      });
    }

    const hydratedScenario = await hydrateScenario(scenario);

    res.json({
      challenge,
      scenario: hydratedScenario
    });
  } catch (error) {
    console.error("Error loading daily challenge:", error);
    res.status(500).json({
      error: "Failed to load daily challenge"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});