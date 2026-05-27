import { useEffect, useRef, useState } from "react";
import "./App.css";
import ScenarioBuilder from "./ScenarioBuilder";
import {
  isEventCard,
  isCharacterCard,
  hasRush,
  canAttack,
} from "./engine/cardRules";
import {
  deepClone,
  findCardByInstanceId,
} from "./engine/gameState";
import {
  canAffordCard,
  attachMultipleDonToTarget,
} from "./engine/donRules";
import { playHandCardToState } from "./engine/playRules";
import {
  resolveAttack,
  evaluateScenarioResult
} from "./engine/combatRules";
import {
  formatTime,
  getDifficultyPoints,
  getSavedDailyResult,
  calculateDailyStats,
  saveFirstDailyResult
} from "./services/dailyStorage";
import {
  fetchTodayChallenge,
  fetchChallengeList,
  fetchArchiveChallenge
} from "./services/challengeApi";
import { shouldUseHoverPreview } from "./utils/device";
import HandViewerModal from "./components/HandViewerModal";
import TrashViewerModal from "./components/TrashViewerModal";
import OpponentBoard from "./components/OpponentBoard";
import PlayerBoard from "./components/PlayerBoard";
import MobileCardPreview from "./components/MobileCardPreview";
import DailyResultModal from "./components/DailyResultModal";
import GameSidebar from "./components/GameSidebar";
import {
  SHOW_BUILDER,
  VISIBILITY_BY_DIFFICULTY
} from "./constants/config";
import GameResultOverlay from "./components/GameResultOverlay";
import { getCardEffect } from "./cardEffects";

import {
  applyEffectStep,
  payAndTrashEvent,
  hasValidEffectTarget
} from "./engine/effectRules";


function App() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [playState, setPlayState] = useState(null);

  const [selectedDonIds, setSelectedDonIds] = useState([]);
  const [selectedHandCardIndex, setSelectedHandCardIndex] = useState(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [actionMode, setActionMode] = useState("idle");
  const [activeEffect, setActiveEffect] = useState(null);

  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [hasWon, setHasWon] = useState(false);
  const [hasConceded, setHasConceded] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [difficultyMode, setDifficultyMode] = useState("hard");
  const [trashViewer, setTrashViewer] = useState(null);
  const [handViewer, setHandViewer] = useState(null);
  const [mobilePreviewCard, setMobilePreviewCard] = useState(null);

  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [hasStartedAction, setHasStartedAction] = useState(false);

  const [challengeList, setChallengeList] = useState([]);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState("");
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState(null);
  const [finishedTimeSeconds, setFinishedTimeSeconds] = useState(null);
  const startTimeRef = useRef(null);

  const [dailyResult, setDailyResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isReplayAttempt, setIsReplayAttempt] = useState(false);
  const [dailyStats, setDailyStats] = useState(calculateDailyStats());

  useEffect(() => {
    const clearPreviewWhenNotOverCard = (event) => {
      if (!shouldUseHoverPreview()) return;

      const elementUnderMouse = document.elementFromPoint(
        event.clientX,
        event.clientY
      );

      const isOverCard = elementUnderMouse?.closest?.(".card-tile");

      if (!isOverCard) {
        setHoveredCard(null);
      }
    };

    window.addEventListener("mousemove", clearPreviewWhenNotOverCard);

    return () => {
      window.removeEventListener("mousemove", clearPreviewWhenNotOverCard);
    };
  }, []);

  const loadChallengeFromResponse = (loadedChallenge, loadedScenario, archiveMode = false) => {
    setDailyChallenge(loadedChallenge);
    setScenario(loadedScenario);
    setPlayState(deepClone(loadedScenario.initialState));

    const savedResult = archiveMode ? null : getSavedDailyResult(loadedChallenge);
    const latestStats = calculateDailyStats();

    setDailyResult(savedResult);
    setDailyStats(latestStats);
    setIsReplayAttempt(!archiveMode && !!savedResult);
    setIsArchiveMode(archiveMode);
    setResultModalOpen(false);

    setSelectedDonIds([]);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");

    setMessage("");
    setLoadError("");
    setHoveredCard(null);
    setMobilePreviewCard(null);

    setHasWon(false);
    setHasLost(false);
    setHasConceded(false);

    setHasStartedAction(false);
    setStartTimeMs(null);
    startTimeRef.current = null;
    setFinishedTimeSeconds(null);
  };

  useEffect(() => {
    if (SHOW_BUILDER) return;

    fetchTodayChallenge()
      .then((data) => {
        const loadedChallenge = data.challenge;
        const loadedScenario = data.scenario;

        loadChallengeFromResponse(loadedChallenge, loadedScenario, false);
        setSelectedArchiveDate(loadedChallenge.date);
      })
      .catch((err) => {
        console.error("Error fetching daily challenge:", err);

        const errorData = err.response?.data;

        const errorMessage =
          typeof errorData === "string"
            ? errorData
            : errorData?.message ||
            errorData?.error ||
            err.message ||
            "Failed to load daily challenge.";

        setLoadError(errorMessage);
      });

    fetchChallengeList()
      .then((data) => {
        setChallengeList(data || []);
      })
      .catch((err) => {
        console.error("Error fetching challenge list:", err);
      });
  }, []);
  const loadArchiveChallenge = (date) => {
    if (!date) return;

    fetchArchiveChallenge(date)
      .then((data) => {
        const loadedChallenge = data.challenge;
        const loadedScenario = data.scenario;

        loadChallengeFromResponse(loadedChallenge, loadedScenario, true);
        setSelectedArchiveDate(date);
      })
      .catch((err) => {
        console.error("Error loading archive challenge:", err);

        const errorData = err.response?.data;

        const errorMessage =
          typeof errorData === "string"
            ? errorData
            : errorData?.message ||
            errorData?.error ||
            err.message ||
            "Failed to load archive challenge.";

        setMessage(errorMessage);
      });
  };

  const loadTodayChallenge = () => {
    const isLockedDailyAttempt =
      !isArchiveMode && hasStartedAction && !hasWon && !hasLost && !hasConceded;

    if (isLockedDailyAttempt) {
      setMessage("You cannot reload today's challenge after making an action.");
      return;
    }

    fetchTodayChallenge()
      .then((data) => {
        const loadedChallenge = data.challenge;
        const loadedScenario = data.scenario;

        loadChallengeFromResponse(loadedChallenge, loadedScenario, false);
        setSelectedArchiveDate(loadedChallenge.date);
      })
      .catch((err) => {
        console.error("Error loading today challenge:", err);
        setMessage("Failed to load today's challenge.");
      });
  };
  const finishDailyChallenge = ({ solved }) => {
    const endTimeMs = Date.now();
    const startedAt = startTimeRef.current || startTimeMs;

    const totalSeconds = startedAt
      ? Math.max(1, Math.floor((endTimeMs - startedAt) / 1000))
      : 0;

    const points = solved ? getDifficultyPoints(difficultyMode) : 0;

    const result = {
      solved,
      difficulty: difficultyMode,
      points: isArchiveMode ? 0 : points,
      timeSeconds: totalSeconds,
      timeText: formatTime(totalSeconds)
    };

    if (isArchiveMode) {
      const archiveResult = {
        challengeId: dailyChallenge?.id,
        challengeTitle: dailyChallenge?.title,
        challengeDate: dailyChallenge?.date,
        ...result,
        savedAt: new Date().toISOString()
      };

      setDailyResult(archiveResult);
      setFinishedTimeSeconds(totalSeconds);
      setResultModalOpen(true);
      setIsReplayAttempt(true);

      return;
    }

    const existingResult = getSavedDailyResult(dailyChallenge);
    const lockedResult = saveFirstDailyResult(dailyChallenge, result);
    const latestStats = calculateDailyStats();

    setDailyResult(lockedResult || result);
    setDailyStats(latestStats);
    setFinishedTimeSeconds(totalSeconds);
    setResultModalOpen(true);
    setIsReplayAttempt(!!existingResult);
  };
  const markActionStarted = () => {
    if (hasStartedAction || hasWon || hasLost || hasConceded) {
      return startTimeRef.current;
    }

    const now = Date.now();

    startTimeRef.current = now;
    setHasStartedAction(true);
    setStartTimeMs(now);

    return now;
  };

  const openMobilePreview = (card) => {
    setHoveredCard(null);
    setMobilePreviewCard({ ...card });
  };

  const closeMobilePreview = () => {
    setMobilePreviewCard(null);
    setHoveredCard(null);
  };

  useEffect(() => {
    const closeOnTouchRelease = () => {
      setMobilePreviewCard(null);
      setHoveredCard(null);
    };

    window.addEventListener("touchend", closeOnTouchRelease);
    window.addEventListener("touchcancel", closeOnTouchRelease);

    return () => {
      window.removeEventListener("touchend", closeOnTouchRelease);
      window.removeEventListener("touchcancel", closeOnTouchRelease);
    };
  }, []);
  const openHandViewer = (side) => {
    setHandViewer({
      side,
      title: side === "you" ? "Your Hand" : "Opponent Hand"
    });
  };

  const closeHandViewer = () => {
    setHandViewer(null);
  };

  const openTrashViewer = (side) => {
    setTrashViewer({
      side,
      title: side === "you" ? "Your Trash" : "Opponent Trash"
    });
  };

  const closeTrashViewer = () => {
    setTrashViewer(null);
  };

  const clearSelections = () => {
    setSelectedDonIds([]);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActiveEffect(null);
    setActionMode("idle");
    setHandViewer(null);
    setHoveredCard(null);
    setMobilePreviewCard(null);
  };



  const isResolvingEffect = activeEffect && actionMode === "select_effect_target";
  const handleHandCardClick = (card, handIndex) => {
    if (hasWon || hasLost || hasConceded) return;
    if (handIndex == null || !playState) return;

    if (isResolvingEffect) {
      const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

      setMessage(
        currentStep?.prompt ||
        "Finish resolving the current event effect before playing another card."
      );

      setHandViewer(null);
      setHoveredCard(null);
      setMobilePreviewCard(null);
      return;
    }

    if (selectedDonIds.length > 0) {
      setMessage("Finish attaching DON first.");
      return;
    }

    if (selectedAttackerId) {
      setSelectedAttackerId(null);
    }

    if (isEventCard(card)) {
      const effect = getCardEffect(card, scenario);

     if (effect?.steps?.length) {
  const firstStep = effect.steps[0];

  const paidResult = payAndTrashEvent(playState, handIndex);

  if (!paidResult.success) {
    setMessage(paidResult.message);
    setActiveEffect(null);
    setActionMode("idle");
    return;
  }

  markActionStarted();

  const paidState = paidResult.nextState;

  setSelectedHandCardIndex(null);
  setSelectedAttackerId(null);
  setSelectedDonIds([]);
  setHoveredCard(null);
  setMobilePreviewCard(null);
  setHandViewer(null);

  if (firstStep.targetRules) {
    setPlayState(paidState);

setActiveEffect({
  effect,
  sourceCardName: card.name || card.cardId || card.id,
  stepIndex: 0,
  workingState: paidState
});
    setActionMode("select_effect_target");
    setMessage(firstStep.prompt || `Selected ${card.name}. Choose a target.`);
    return;
  }

  const { nextState, success, message: resultMessage } = applyEffectStep(
    paidState,
    firstStep,
    null
  );

  if (!success) {
    setPlayState(paidState);
    setMessage(resultMessage);
    setActiveEffect(null);
    setActionMode("idle");
    return;
  }

  setPlayState(nextState);
  setActiveEffect(null);
  setActionMode("idle");
  setHoveredCard(null);
  setMobilePreviewCard(null);
  setMessage(resultMessage);
  return;
}

      const { nextState, success, message: resultMessage } = playHandCardToState(
        playState,
        handIndex
      );

      if (!success) {
        setMessage(resultMessage);
        setSelectedHandCardIndex(null);
        setActionMode("idle");
        return;
      }

      markActionStarted();

      setPlayState(nextState);
      setSelectedHandCardIndex(null);
      setActionMode("idle");
      setHandViewer(null);
      setHoveredCard(null);
      setMobilePreviewCard(null);

      setMessage(resultMessage);
      return;
    }

    if (isCharacterCard(card)) {
      if (!canAffordCard(playState.you, card)) {
        setMessage(`Not enough active DON to play ${card.name}.`);
        return;
      }

      const nextSelectedIndex = selectedHandCardIndex === handIndex ? null : handIndex;

      setSelectedHandCardIndex(nextSelectedIndex);
      setSelectedAttackerId(null);
      setActionMode(nextSelectedIndex === null ? "idle" : "play_hand_character");

      setHandViewer(null);

      setMessage(
        nextSelectedIndex === null
          ? ""
          : `Selected ${card.name}. Click an empty character slot to play it.`
      );
      return;
    }

    setMessage(`${card.name} cannot be played with the current rules yet.`);
  };
  const handleEmptyCharacterSlotClick = () => {
    if (hasWon || hasLost || hasConceded) return;

    if (selectedHandCardIndex == null || actionMode !== "play_hand_character" || !playState) {
      return;
    }

    const { nextState, success, message: resultMessage } = playHandCardToState(
      playState,
      selectedHandCardIndex
    );

    if (!success) {
      setMessage(resultMessage);
      return;
    }

    markActionStarted();

    setPlayState(nextState);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setActionMode("idle");
    setHoveredCard(null);
    setMessage(resultMessage);

  };

  const handleAttackerClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;
    if (isResolvingEffect) {
      const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

      setMessage(
        currentStep?.prompt ||
        "Finish resolving the current event effect before attacking."
      );

      return;
    }
    if (!card?.instanceId || selectedDonIds.length > 0 || !playState) return;

    if (selectedHandCardIndex != null) {
      setSelectedHandCardIndex(null);
    }

    const ref = findCardByInstanceId(playState, card.instanceId);
    if (!ref || ref.side !== "you") return;

    if (!canAttack(ref.card)) {
      if (ref.card?.summoningSick && !hasRush(ref.card)) {
        setMessage(`${ref.card.name} cannot attack the turn it is played unless it has Rush.`);
        return;
      }

      setMessage("That card cannot attack.");
      return;
    }

    setSelectedAttackerId(card.instanceId);
    setActionMode("select_attack_target");
    setHoveredCard(null);
    setMessage(`Selected attacker: ${card.name}. Choose a target.`);
  };

const handleEffectTargetClick = (card) => {
  if (!activeEffect || actionMode !== "select_effect_target") {
    return false;
  }

  if (!card?.instanceId) {
    return true;
  }

  const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

  const { nextState, success, message } = applyEffectStep(
    activeEffect.workingState,
    currentStep,
    card.instanceId
  );

  if (!success) {
    setMessage(message);
    return true;
  }

  markActionStarted();

  const nextStepIndex = activeEffect.stepIndex + 1;
  const nextStep = activeEffect.effect.steps[nextStepIndex];

  if (nextStep) {
    const nextStepHasTarget = hasValidEffectTarget(nextState, nextStep);

    if (!nextStepHasTarget && nextStep.optional) {
      setPlayState(nextState);
      setActiveEffect(null);
      setSelectedHandCardIndex(null);
      setSelectedAttackerId(null);
      setSelectedDonIds([]);
      setActionMode("idle");
      setHandViewer(null);
      setHoveredCard(null);
      setMobilePreviewCard(null);
      setMessage(`${message} No valid target for the next effect, so it was skipped.`);

      return true;
    }

    if (!nextStepHasTarget) {
      setPlayState(nextState);

      setActiveEffect({
        ...activeEffect,
        stepIndex: nextStepIndex,
        workingState: nextState
      });

      setHandViewer(null);
      setHoveredCard(null);
      setMobilePreviewCard(null);
      setMessage("No valid target for the next effect. You may need to concede.");

      return true;
    }

    setPlayState(nextState);

    setActiveEffect({
      ...activeEffect,
      stepIndex: nextStepIndex,
      workingState: nextState
    });

    setHandViewer(null);
    setHoveredCard(null);
    setMobilePreviewCard(null);
    setMessage(nextStep.prompt || "Choose the next effect target.");

    return true;
  }

  setPlayState(nextState);
  setActiveEffect(null);
  setSelectedHandCardIndex(null);
  setSelectedAttackerId(null);
  setSelectedDonIds([]);
  setActionMode("idle");
  setHandViewer(null);
  setHoveredCard(null);
  setMobilePreviewCard(null);
  setMessage(`${activeEffect.sourceCardName || activeEffect.effect.name || "Effect"} resolved.`);

  return true;
};

  const handleAttachTargetClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;
    if (!card?.instanceId || !playState) return;
    if (handleEffectTargetClick(card)) {
      return;
    }

    if (selectedDonIds.length > 0) {
      const nextState = attachMultipleDonToTarget(
        playState,
        selectedDonIds,
        card.instanceId
      );

      markActionStarted();

      setPlayState(nextState);
      setSelectedDonIds([]);
      setSelectedHandCardIndex(null);
      setSelectedAttackerId(null);
      setActionMode("idle");
      setMessage("DON attached.");
      return;
    }

    if (selectedHandCardIndex != null) {
      const isYourBoardCharacter = playState.you.board.some(
        (boardCard) => boardCard.instanceId === card.instanceId
      );

      if (!isYourBoardCharacter) {
        setMessage("You can only replace one of your own characters.");
        return;
      }

      if ((playState.you.board?.length || 0) < 5) {
        setMessage("You can only replace a character when your board has 5 characters.");
        return;
      }

      const { nextState, success, message: resultMessage } = playHandCardToState(
        playState,
        selectedHandCardIndex,
        card.instanceId
      );

      if (!success) {
        setMessage(resultMessage);
        return;
      }

      markActionStarted();

      setPlayState(nextState);
      setSelectedHandCardIndex(null);
      setSelectedAttackerId(null);
      setActionMode("idle");
      setHoveredCard(null);
      setMessage(resultMessage);
      return;
    }

    handleAttackerClick(card);
  };

  const handleAttackTargetClick = (card) => {
    if (hasWon || hasLost || hasConceded) return;

    if (handleEffectTargetClick(card)) {
      return;
    }

    if (actionMode !== "select_attack_target" || !selectedAttackerId || !card?.instanceId) {
      return;
    }

    markActionStarted();

    const { nextState, resultMessage } = resolveAttack(
      playState,
      selectedAttackerId,
      card.instanceId,
      scenario
    );

    const scenarioResult = evaluateScenarioResult(nextState);

    setPlayState(nextState);
    clearSelections();

    if (scenarioResult.finished) {
      setHasWon(true);
      setHasLost(false);
      setHasConceded(false);
      setMessage("");

      finishDailyChallenge({ solved: true });

      return;
    }

    setMessage(resultMessage);
  };

  const handleDonClick = (donId) => {
    if (hasWon || hasLost || hasConceded) return;

    if (isResolvingEffect) {
      const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

      setMessage(
        currentStep?.prompt ||
        "Finish resolving the current event effect before attaching DON."
      );

      return;
    }

    setHoveredCard(null);
    setSelectedAttackerId(null);
    setSelectedHandCardIndex(null);
    setActiveEffect(null);
    setActionMode("idle");

    setSelectedDonIds((prev) =>
      prev.includes(donId)
        ? prev.filter((id) => id !== donId)
        : [...prev, donId]
    );
  };

  const resetScenario = () => {
    if (!scenario) return;

    // Cannot reset mid-attempt after making an action.
    if (!isArchiveMode && hasStartedAction && !hasWon && !hasLost && !hasConceded) {
      setMessage("You cannot reset after making an action.");
      return;
    }
    setPlayState(deepClone(scenario.initialState));
    clearSelections();

    setMessage("");
    setHasWon(false);
    setHasLost(false);
    setHasConceded(false);

    setHasStartedAction(false);
    setStartTimeMs(null);
    startTimeRef.current = null;
    setFinishedTimeSeconds(null);

    // If today already has a locked result, this new run is replay/practice.
    setIsReplayAttempt(!!getSavedDailyResult(dailyChallenge));
  };

  const handleConcede = () => {
    clearSelections();
    setMessage("");
    setHasWon(false);
    setHasLost(false);
    setHasConceded(true);

    finishDailyChallenge({ solved: false });
  };

  if (SHOW_BUILDER) {
    return <ScenarioBuilder />;
  }

  if (loadError) {
    return (
      <div className="app-shell" style={{ color: "white", fontSize: "24px", padding: "30px" }}>
        Failed to load: {String(loadError)}
      </div>
    );
  }

  if (!scenario || !playState) {
    return (
      <div className="app-shell" style={{ color: "white", fontSize: "24px", padding: "30px" }}>
        Loading...
      </div>
    );
  }
  const visibility = VISIBILITY_BY_DIFFICULTY[difficultyMode];

  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper">
          <OpponentBoard
            data={playState.opponent}
            setHoveredCard={setHoveredCard}
            onTargetClick={handleAttackTargetClick}
            visibility={visibility}
            onTrashClick={() => openTrashViewer("opponent")}
            onOpenHand={() => openHandViewer("opponent")}
            onMobilePreview={openMobilePreview}
            onMobilePreviewClose={closeMobilePreview}
          />
          <PlayerBoard
            data={playState.you}
            setHoveredCard={setHoveredCard}
            selectedDonIds={selectedDonIds}
            onDonClick={handleDonClick}
            onAttachTargetClick={handleAttachTargetClick}
            onHandCardClick={handleHandCardClick}
            onEmptyCharacterSlotClick={handleEmptyCharacterSlotClick}
            selectedHandCardIndex={selectedHandCardIndex}
            onTrashClick={() => openTrashViewer("you")}
            onOpenHand={() => openHandViewer("you")}
            onMobilePreview={openMobilePreview}
            onMobilePreviewClose={closeMobilePreview}
          />
        </main>
        <MobileCardPreview
          card={mobilePreviewCard}
          onClose={closeMobilePreview}
        />

        {trashViewer && (
          <TrashViewerModal
            title={trashViewer.title}
            cards={playState?.[trashViewer.side]?.trash || []}
            onClose={closeTrashViewer}
            setHoveredCard={setHoveredCard}
            onMobilePreview={openMobilePreview}
          />
        )}
        {handViewer && (
          <HandViewerModal
            title={handViewer.title}
            cards={playState?.[handViewer.side]?.hand || []}
            hiddenCards={
              handViewer.side === "opponent" && !visibility.showOpponentHand
            }
            onClose={closeHandViewer}
            setHoveredCard={setHoveredCard}
            onCardClick={handViewer.side === "you" ? handleHandCardClick : undefined}
            selectedHandCardIndex={
              handViewer.side === "you" ? selectedHandCardIndex : null
            }
            onMobilePreview={openMobilePreview}
          />
        )}

        {hoveredCard && (
          <div className="center-preview">
            <img src={hoveredCard.image} alt={hoveredCard.name} />
          </div>
        )}

        {resultModalOpen && (
          <DailyResultModal
            dailyResult={dailyResult}
            dailyStats={dailyStats}
            isArchiveMode={isArchiveMode}
            isReplayAttempt={isReplayAttempt}
            onClose={() => setResultModalOpen(false)}
            onPlayAgain={() => {
              setResultModalOpen(false);
              resetScenario();
            }}
          />
        )}

        <GameResultOverlay
          hasWon={hasWon}
          hasLost={hasLost}
          hasConceded={hasConceded}
        />


        <GameSidebar

          scenario={scenario}
          isArchiveMode={isArchiveMode}
          message={message}

          difficultyMode={difficultyMode}
          setDifficultyMode={setDifficultyMode}

          resetScenario={resetScenario}
          handleConcede={handleConcede}

          hasStartedAction={hasStartedAction}
          hasWon={hasWon}
          hasLost={hasLost}
          hasConceded={hasConceded}

          loadTodayChallenge={loadTodayChallenge}
          disableDifficultyChange={
            !isArchiveMode && hasStartedAction && !hasWon && !hasLost && !hasConceded
          }
          disableLoadToday={
            !isArchiveMode && hasStartedAction && !hasWon && !hasLost && !hasConceded
          }
          selectedArchiveDate={selectedArchiveDate}
          loadArchiveChallenge={loadArchiveChallenge}
          challengeList={challengeList}

        />
      </div>
    </div>
  );
}

export default App;