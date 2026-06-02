import { useEffect, useRef, useState } from "react";
import "./App.css";
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
import { playHandCardToState } from "./engine/playRules.js";
import {
  resolveAttack,
  evaluateScenarioResult
} from "./engine/combatRules";
import {
  formatTime,
  getDifficultyPoints,
  getSavedDailyResult,
  calculateDailyStats,
  saveFirstDailyResult,
  getSavedDailyProgress,
  saveDailyProgress,
  clearDailyProgress
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
  VISIBILITY_BY_DIFFICULTY
} from "./constants/config";
import GameResultOverlay from "./components/GameResultOverlay";
import { getCardEffect } from "./cardEffects";

import {
  applyEffectStep,
  payAndTrashEvent,
  hasValidEffectTarget
} from "./engine/effectRules";

import {
  ABILITY_TRIGGERS,
  getTriggeredAbility,
  getActivateMainAbility,
  isActivateMainAbilityUsed,
  markActivateMainAbilityUsed
} from "./cardAbilities";
import { CURRENT_APP_VERSION } from "./generated/appVersion";


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

  const [actionChoiceCard, setActionChoiceCard] = useState(null);

  const [dailyResult, setDailyResult] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isReplayAttempt, setIsReplayAttempt] = useState(false);
  const [dailyStats, setDailyStats] = useState(calculateDailyStats());

  useEffect(() => {
  const checkForNewAppVersion = async () => {
    try {
      const response = await fetch(`/app-version.json?ts=${Date.now()}`, {
        cache: "no-store"
      });

      const data = await response.json();

      if (data?.version && data.version !== CURRENT_APP_VERSION) {
        window.location.reload();
      }
    } catch (error) {
      console.warn("Could not check app version:", error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkForNewAppVersion();
    }
  };

  window.addEventListener("focus", checkForNewAppVersion);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const intervalId = window.setInterval(checkForNewAppVersion, 5 * 60 * 1000);

  checkForNewAppVersion();

  return () => {
    window.removeEventListener("focus", checkForNewAppVersion);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.clearInterval(intervalId);
  };
}, []);

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

  const loadChallengeFromResponse = (
    loadedChallenge,
    loadedScenario,
    archiveMode = false
  ) => {
    const savedResult = archiveMode ? null : getSavedDailyResult(loadedChallenge);

    if (!archiveMode && savedResult) {
      clearDailyProgress(loadedChallenge);
    }

    const savedProgress =
      archiveMode || savedResult ? null : getSavedDailyProgress(loadedChallenge);

    const shouldRestoreProgress =
      !!savedProgress &&
      savedProgress.challengeDate === loadedChallenge.date &&
      !!savedProgress.playState;

    setDailyChallenge(loadedChallenge);
    setScenario(loadedScenario);


    setPlayState(
      shouldRestoreProgress
        ? savedProgress.playState
        : deepClone(loadedScenario.initialState)
    );

    const latestStats = calculateDailyStats();

    setDailyResult(savedResult);
    setDailyStats(latestStats);
    setIsReplayAttempt(!archiveMode && !!savedResult);
    setIsArchiveMode(archiveMode);
    setResultModalOpen(false);

    setSelectedDonIds(
      shouldRestoreProgress ? savedProgress.selectedDonIds || [] : []
    );

    setSelectedHandCardIndex(
      shouldRestoreProgress
        ? savedProgress.selectedHandCardIndex ?? null
        : null
    );

    setSelectedAttackerId(
      shouldRestoreProgress
        ? savedProgress.selectedAttackerId ?? null
        : null
    );

    setActiveEffect(
      shouldRestoreProgress ? savedProgress.activeEffect || null : null
    );

    setActionMode(
      shouldRestoreProgress ? savedProgress.actionMode || "idle" : "idle"
    );

    setMessage(shouldRestoreProgress ? "Daily attempt restored." : "");
    setLoadError("");
    setHoveredCard(null);
    setMobilePreviewCard(null);
    setHandViewer(null);
    setTrashViewer(null);

    setHasWon(false);
    setHasLost(false);
    setHasConceded(false);

    setHasStartedAction(
      shouldRestoreProgress ? !!savedProgress.hasStartedAction : false
    );

    const restoredStartTime = shouldRestoreProgress
      ? savedProgress.startTimeMs || null
      : null;

    setStartTimeMs(restoredStartTime);
    startTimeRef.current = restoredStartTime;
    setFinishedTimeSeconds(null);
  };

  useEffect(() => {

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

  const isDailyAttemptLocked =
    !isArchiveMode && hasStartedAction && !hasWon && !hasLost && !hasConceded;
  const loadArchiveChallenge = (date) => {
    if (!date) return;

    if (isDailyAttemptLocked) {
      setMessage("You cannot switch challenges after making an action.");
      return;
    }

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
    if (isDailyAttemptLocked) {
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

const handleOpponentDonTargetClick = (donId) => {
  if (!activeEffect) return;

  const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

  const canTargetDon =
    currentStep?.targetRules?.zones?.includes("don") &&
    currentStep?.targetRules?.sides?.includes("opponent");

  if (!canTargetDon) return;

  handleEffectTargetClick({
    instanceId: `opponent-don-${donId}`,
    id: donId
  });
};

  const handleDifficultyChange = (nextDifficulty) => {
    if (isDailyAttemptLocked) {
      setMessage("You cannot change difficulty after making an action.");
      return;
    }

    setDifficultyMode(nextDifficulty);
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
    clearDailyProgress(dailyChallenge);
    const latestStats = calculateDailyStats();

    setDailyResult(lockedResult || result);
    setDailyStats(latestStats);
    setFinishedTimeSeconds(totalSeconds);
    setResultModalOpen(true);
    setIsReplayAttempt(!!existingResult);
  };

  const cleanCardForProgress = (card) => {
    if (!card) return card;

    const {
      raw,
      fullText,
      description,
      ...safeCard
    } = card;

    return {
      ...safeCard,
      attachedDon: card.attachedDon || [],
      rested: !!card.rested
    };
  };

  const cleanCardArrayForProgress = (cards = []) => {
    return (cards || []).map(cleanCardForProgress);
  };

  const cleanSideForProgress = (side = {}) => {
    return {
      ...side,
      leader: cleanCardForProgress(side.leader),
      stage: cleanCardForProgress(side.stage),
      hand: cleanCardArrayForProgress(side.hand),
      deck: cleanCardArrayForProgress(side.deck),
      trash: cleanCardArrayForProgress(side.trash),
      life: Array.isArray(side.life)
        ? cleanCardArrayForProgress(side.life)
        : side.life,
      board: cleanCardArrayForProgress(side.board),
      don: side.don || []
    };
  };

  const cleanPlayStateForProgress = (state) => {
    if (!state) return state;

    return {
      ...state,
      you: cleanSideForProgress(state.you),
      opponent: cleanSideForProgress(state.opponent)
    };
  };

  const saveCurrentDailyProgress = (nextPlayState, overrides = {}) => {
    if (isArchiveMode) return;
    if (!dailyChallenge) return;
    if (!nextPlayState) return;
    if (hasWon || hasLost || hasConceded) return;

    const savedResult = getSavedDailyResult(dailyChallenge);

    // If first result is already locked, this is replay/practice.
    if (savedResult) return;

    const progressPayload = {
      playState: cleanPlayStateForProgress(nextPlayState),
      difficultyMode,

      selectedDonIds: overrides.selectedDonIds ?? selectedDonIds,
      selectedHandCardIndex:
        overrides.selectedHandCardIndex ?? selectedHandCardIndex,
      selectedAttackerId: overrides.selectedAttackerId ?? selectedAttackerId,
      activeEffect: overrides.activeEffect ?? activeEffect,
      actionMode: overrides.actionMode ?? actionMode,

      hasStartedAction: true,
      startTimeMs: startTimeRef.current || startTimeMs || Date.now()
    };

    try {
      saveDailyProgress(dailyChallenge, progressPayload);
      console.log("Daily progress saved:", dailyChallenge.date);
    } catch (error) {
      console.error("Failed to save daily progress:", error);
    }
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

  useEffect(() => {
    if (isArchiveMode) return;
    if (!dailyChallenge) return;
    if (!playState) return;
    if (!hasStartedAction) return;
    if (hasWon || hasLost || hasConceded) return;

    const savedResult = getSavedDailyResult(dailyChallenge);

    // If first result is already locked, this is replay/practice.
    if (savedResult) return;

    saveDailyProgress(dailyChallenge, {
      playState,
      difficultyMode,
      selectedDonIds,
      selectedHandCardIndex,
      selectedAttackerId,
      activeEffect,
      actionMode,
      hasStartedAction,
      startTimeMs: startTimeRef.current || startTimeMs
    });
  }, [
    dailyChallenge,
    playState,
    difficultyMode,
    selectedDonIds,
    selectedHandCardIndex,
    selectedAttackerId,
    activeEffect,
    actionMode,
    hasStartedAction,
    hasWon,
    hasLost,
    hasConceded,
    isArchiveMode,
    startTimeMs
  ]);

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
    setActionChoiceCard(null);
    setHandViewer(null);
    setHoveredCard(null);
    setMobilePreviewCard(null);
  };



  const isResolvingEffect = activeEffect && actionMode === "select_effect_target";
  const currentEffectStep =
    activeEffect?.effect?.steps?.[activeEffect.stepIndex] || null;

  const canSkipCurrentEffectStep =
    actionMode === "select_effect_target" &&
    !!activeEffect &&
    !!currentEffectStep?.optional;
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
      const effect =
        getTriggeredAbility(card, scenario, ABILITY_TRIGGERS.ON_PLAY) ||
        getCardEffect(card, scenario);

      if (effect?.steps?.length) {
        const firstStep = effect.steps[0];

        const paidResult = payAndTrashEvent(playState, handIndex, effect);

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
          const nextActiveEffect = {
            effect,
            sourceCardName: card.name || card.cardId || card.id,
            stepIndex: 0,
            workingState: paidState
          };

          setPlayState(paidState);
          setActiveEffect(nextActiveEffect);
          setActionMode("select_effect_target");

          saveCurrentDailyProgress(paidState, {
            activeEffect: nextActiveEffect,
            actionMode: "select_effect_target",
            selectedDonIds: [],
            selectedHandCardIndex: null,
            selectedAttackerId: null
          });

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

    const playedCardFromHand = playState.you.hand[selectedHandCardIndex];
    const onPlayAbility = getTriggeredAbility(
      playedCardFromHand,
      scenario,
      ABILITY_TRIGGERS.ON_PLAY
    );

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

    if (onPlayAbility) {
      startTriggeredAbility(onPlayAbility, playedCardFromHand, nextState);
      return;
    }

    setMessage(resultMessage);

  };

  const getAttachedDonRequirement = (ability) => {
  return Number(ability?.requirements?.sourceAttachedDon || 0);
};

const hasRequiredAttachedDonForAbility = (sourceCard, ability) => {
  const requiredAttachedDon = getAttachedDonRequirement(ability);

  if (requiredAttachedDon <= 0) {
    return true;
  }

  const attachedDonCount = Array.isArray(sourceCard?.attachedDon)
    ? sourceCard.attachedDon.length
    : 0;

  return attachedDonCount >= requiredAttachedDon;
};

  const getUsableActivateMainAbility = (card) => {
  if (!card || !playState) return null;

  const ability = getActivateMainAbility(card, scenario);

  if (!ability) return null;

  if (
    ability.oncePerTurn &&
    isActivateMainAbilityUsed(playState, "you", ability, card.instanceId)
  ) {
    return null;
  }

  if (!hasRequiredAttachedDonForAbility(card, ability)) {
    return null;
  }

  return ability;
};

  const handleCardActionChoice = (card) => {
    if (!card?.instanceId || !playState) return false;

    const ref = findCardByInstanceId(playState, card.instanceId);

    if (!ref || ref.side !== "you") return false;

    const usableAbility = getUsableActivateMainAbility(ref.card);
    const canAttackWithCard = canAttack(ref.card);

    if (usableAbility && canAttackWithCard) {
      setActionChoiceCard(ref.card);
      setSelectedAttackerId(null);
      setActionMode("idle");
      setHoveredCard(null);
      setMobilePreviewCard(null);
      setMessage(`Choose an action for ${ref.card.name || ref.card.cardId}.`);
      return true;
    }

    if (usableAbility) {
      startActivateMainAbility(ref.card);
      return true;
    }

    return false;
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
  const skipCurrentOptionalEffectStep = () => {
    if (!canSkipCurrentEffectStep) {
      return;
    }

    const currentState = activeEffect.workingState || playState;

    const nextStepIndex = activeEffect.stepIndex + 1;
    const nextStep = activeEffect.effect.steps[nextStepIndex];

    if (nextStep) {
      const nextActiveEffect = {
        ...activeEffect,
        stepIndex: nextStepIndex,
        workingState: currentState
      };
      finishActiveEffectResolution(
  activeEffect,
  currentState,
  `${activeEffect.sourceCardName || activeEffect.effect.name || "Effect"} resolved. Optional effect skipped.`
);

      setActiveEffect(nextActiveEffect);
      setPlayState(currentState);

      saveCurrentDailyProgress(currentState, {
        activeEffect: nextActiveEffect,
        actionMode: "select_effect_target",
        selectedDonIds: [],
        selectedHandCardIndex: null,
        selectedAttackerId: null
      });

      setHandViewer(null);
      setHoveredCard(null);
      setMobilePreviewCard(null);
      setMessage(nextStep.prompt || "Choose the next effect target.");

      return;
    }

    setPlayState(currentState);
    setActiveEffect(null);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setSelectedDonIds([]);
    setActionMode("idle");
    setHandViewer(null);
    setHoveredCard(null);
    setMobilePreviewCard(null);

    saveCurrentDailyProgress(currentState, {
      activeEffect: null,
      actionMode: "idle",
      selectedDonIds: [],
      selectedHandCardIndex: null,
      selectedAttackerId: null
    });

    setMessage(
      `${activeEffect.sourceCardName || activeEffect.effect.name || "Effect"} resolved. Optional effect skipped.`
    );
  };

  const finishActiveEffectResolution = (effectState, finalState, finalMessage) => {
    let completedState = finalState;

    if (effectState.effect?.oncePerTurn) {
      completedState = markActivateMainAbilityUsed(
        completedState,
        "you",
        effectState.effect,
        effectState.sourceInstanceId
      );
    }

    setPlayState(completedState);
    setActiveEffect(null);
    setSelectedHandCardIndex(null);
    setSelectedAttackerId(null);
    setSelectedDonIds([]);
    setActionMode("idle");
    setHandViewer(null);
    setHoveredCard(null);
    setMobilePreviewCard(null);

    saveCurrentDailyProgress(completedState, {
      activeEffect: null,
      actionMode: "idle",
      selectedDonIds: [],
      selectedHandCardIndex: null,
      selectedAttackerId: null
    });
   if (effectState.pendingAttack?.attackerId && effectState.pendingAttack?.targetId) {
  setActiveEffect(null);
  setSelectedHandCardIndex(null);
  setSelectedDonIds([]);
  setSelectedAttackerId(null);
  setActionMode("idle");
  setHandViewer(null);
  setHoveredCard(null);
  setMobilePreviewCard(null);

  resolveDeclaredAttack(
    completedState,
    effectState.pendingAttack.attackerId,
    effectState.pendingAttack.targetId
  );

  return;
}

    setMessage(
      finalMessage ||
      `${effectState.sourceCardName || effectState.effect.name || "Effect"} resolved.`
    );
  };

  const continueEffectResolution = (
    effectState,
    stateAfterStep,
    nextStepIndex,
    previousMessage = ""
  ) => {
    let workingState = stateAfterStep;
    let stepIndex = nextStepIndex;
    let latestMessage = previousMessage;

    while (stepIndex < effectState.effect.steps.length) {
      const nextStep = effectState.effect.steps[stepIndex];

      if (nextStep.targetRules) {
        const nextStepHasTarget = hasValidEffectTarget(workingState, nextStep);

        if (!nextStepHasTarget && nextStep.optional) {
          stepIndex += 1;
          continue;
        }

        if (!nextStepHasTarget) {
          const nextActiveEffect = {
            ...effectState,
            stepIndex,
            workingState
          };

          setPlayState(workingState);
          setActiveEffect(nextActiveEffect);
          setActionMode("select_effect_target");
          setMessage("No valid target for the next effect. You may need to concede.");

          return;
        }

        const nextActiveEffect = {
          ...effectState,
          stepIndex,
          workingState
        };

        setPlayState(workingState);
        setActiveEffect(nextActiveEffect);
        setActionMode("select_effect_target");

        saveCurrentDailyProgress(workingState, {
          activeEffect: nextActiveEffect,
          actionMode: "select_effect_target",
          selectedDonIds: [],
          selectedHandCardIndex: null,
          selectedAttackerId: null
        });

        setHandViewer(null);
        setHoveredCard(null);
        setMobilePreviewCard(null);
        setMessage(nextStep.prompt || "Choose the next effect target.");

        return;
      }

      const result = applyEffectStep(workingState, nextStep, null);

      if (!result.success) {
        setPlayState(workingState);
        setActiveEffect(null);
        setActionMode("idle");
        setMessage(result.message || "Effect failed.");
        return;
      }

      workingState = result.nextState;
      latestMessage = result.message || latestMessage;
      stepIndex += 1;
    }

    finishActiveEffectResolution(effectState, workingState, latestMessage);
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

    continueEffectResolution(
      activeEffect,
      nextState,
      activeEffect.stepIndex + 1,
      message
    );

    return true;
  };

  const startTriggeredAbility = (
    ability,
    sourceCard,
    workingState,
    extra = {}
  ) => {
    if (!ability || !sourceCard || !workingState) return false;

    const allSteps = [
      ...(ability.costSteps || []),
      ...(ability.steps || [])
    ];

    if (allSteps.length === 0) {
      setMessage(`${ability.name || "Ability"} has no steps.`);
      return true;
    }

    markActionStarted();

    const abilityEffect = {
      ...ability,
      steps: allSteps
    };

    const abilityState = {
      kind: ability.trigger,
      effect: abilityEffect,
      sourceInstanceId: sourceCard.instanceId,
      sourceCardName: sourceCard.name || sourceCard.cardId || sourceCard.id,
      stepIndex: 0,
      workingState,
      pendingAttack: extra.pendingAttack || null
    };

    continueEffectResolution(abilityState, workingState, 0);

    return true;
  };

  const startActivateMainAbility = (sourceCard) => {
    if (hasWon || hasLost || hasConceded) return;
    if (!sourceCard || !playState) return;

    if (isResolvingEffect) {
      setMessage("Finish resolving the current effect first.");
      return;
    }

    const ability = getTriggeredAbility(
      sourceCard,
      scenario,
      ABILITY_TRIGGERS.ACTIVATE_MAIN
    );

if (!hasRequiredAttachedDonForAbility(sourceCard, ability)) {
  const requiredAttachedDon = getAttachedDonRequirement(ability);

  setMessage(
    `${sourceCard.name || sourceCard.cardId} needs at least ${requiredAttachedDon} attached DON to use this Activate: Main ability.`
  );

  return true;
}

    if (
      ability.oncePerTurn &&
      isActivateMainAbilityUsed(playState, "you", ability, sourceCard.instanceId)
    ) {
      setMessage("This Activate: Main ability has already been used.");
      return true;
    }

    const allSteps = [
      ...(ability.costSteps || []),
      ...(ability.steps || [])
    ];

    if (allSteps.length === 0) {
      setMessage("This ability has no steps.");
      return true;
    }

    markActionStarted();

    const abilityEffect = {
      ...ability,
      steps: allSteps
    };

    const abilityState = {
      kind: "activate_main",
      effect: abilityEffect,
      sourceInstanceId: sourceCard.instanceId,
      sourceCardName: sourceCard.name || sourceCard.cardId || sourceCard.id,
      stepIndex: 0,
      workingState: playState
    };

    continueEffectResolution(abilityState, playState, 0);

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

      saveCurrentDailyProgress(nextState, {
        selectedDonIds: [],
        selectedHandCardIndex: null,
        selectedAttackerId: null,
        activeEffect: null,
        actionMode: "idle"
      });

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

    if (handleCardActionChoice(card)) {
      return;
    }

    handleAttackerClick(card);
  };

  const canPlayerStillAttackOrCreateAttack = (state) => {
    if (!state?.you) return false;

    const yourCardsThatCanAttack = [
      state.you.leader,
      ...(state.you.board || [])
    ].filter(Boolean);

    const hasReadyAttacker = yourCardsThatCanAttack.some((card) =>
      canAttack(card)
    );

    if (hasReadyAttacker) {
      return true;
    }

    const boardCanReceiveCharacter = (state.you.board || []).length < 5;
    const boardCanReplaceCharacter = (state.you.board || []).length >= 5;

    const canPlayRushCharacter = (state.you.hand || []).some((card) => {
      if (!isCharacterCard(card)) return false;
      if (!hasRush(card)) return false;
      if (!canAffordCard(state.you, card)) return false;

      return boardCanReceiveCharacter || boardCanReplaceCharacter;
    });

    return canPlayRushCharacter;
  };

  const resolveDeclaredAttack = (stateBeforeAttack, attackerId, targetId) => {
  markActionStarted();

  const { nextState, resultMessage } = resolveAttack(
    stateBeforeAttack,
    attackerId,
    targetId,
    scenario
  );

  const scenarioResult = evaluateScenarioResult(nextState);

  setPlayState(nextState);

  saveCurrentDailyProgress(nextState, {
    selectedDonIds: [],
    selectedHandCardIndex: null,
    selectedAttackerId: null,
    activeEffect: null,
    actionMode: "idle"
  });

  clearSelections();

  if (scenarioResult.finished) {
    setHasWon(true);
    setHasLost(false);
    setHasConceded(false);
    setMessage("");

    finishDailyChallenge({ solved: true });
    return;
  }

  if (!canPlayerStillAttackOrCreateAttack(nextState)) {
    setHasWon(false);
    setHasLost(true);
    setHasConceded(false);

    setMessage(
      `${resultMessage} You have no attacks left and cannot play a Rush character.`
    );

    finishDailyChallenge({ solved: false });
    return;
  }

  setMessage(resultMessage);
};

const handleAttackTargetClick = (card) => {
  if (hasWon || hasLost || hasConceded) return;

  if (handleEffectTargetClick(card)) {
    return;
  }

  if (
    actionMode !== "select_attack_target" ||
    !selectedAttackerId ||
    !card?.instanceId
  ) {
    return;
  }

  const attackerRef = findCardByInstanceId(playState, selectedAttackerId);

  if (!attackerRef || attackerRef.side !== "you") {
    setMessage("Invalid attacker.");
    return;
  }

  const whenAttackingAbility = getTriggeredAbility(
    attackerRef.card,
    scenario,
    ABILITY_TRIGGERS.WHEN_ATTACKING
  );

  if (whenAttackingAbility) {
    startTriggeredAbility(whenAttackingAbility, attackerRef.card, playState, {
      pendingAttack: {
        attackerId: selectedAttackerId,
        targetId: card.instanceId,
        attackerName: attackerRef.card.name || attackerRef.card.cardId,
        targetName: card.name || card.cardId
      }
    });

    return;
  }

  resolveDeclaredAttack(playState, selectedAttackerId, card.instanceId);
};

  const handleDonClick = (donId) => {
      if (activeEffect) {
    const currentStep = activeEffect.effect.steps[activeEffect.stepIndex];

    const canTargetDon =
      currentStep?.targetRules?.zones?.includes("don") &&
      currentStep?.targetRules?.sides?.includes("you");

    if (canTargetDon) {
      handleEffectTargetClick({
        instanceId: `you-don-${donId}`,
        id: donId
      });
      return;
    }
  }
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
  const baseVisibility = VISIBILITY_BY_DIFFICULTY[difficultyMode];

  const gameIsFinished = hasWon || hasLost || hasConceded;

  const visibility = gameIsFinished
    ? {
      ...baseVisibility,
      showOpponentHand: true,
      showOpponentLife: true
    }
    : baseVisibility;
  return (
    <div className="app-shell">
      <div className="layout">
        <main className="board-wrapper">
          <OpponentBoard
            data={playState.opponent}
            setHoveredCard={setHoveredCard}
            onTargetClick={handleAttackTargetClick}
            onDonTargetClick={handleOpponentDonTargetClick}
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
            onStageClick={handleAttachTargetClick}
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
        {actionChoiceCard && (
          <div className="action-choice-overlay">
            <div className="action-choice-card">
              <h2>{actionChoiceCard.name || actionChoiceCard.cardId}</h2>
              <p>Choose an action.</p>

              <div className="action-choice-buttons">
                <button
                  type="button"
                  onClick={() => {
                    const chosenCard = actionChoiceCard;
                    setActionChoiceCard(null);
                    handleAttackerClick(chosenCard);
                  }}
                >
                  ATTACK
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const chosenCard = actionChoiceCard;
                    setActionChoiceCard(null);
                    startActivateMainAbility(chosenCard);
                  }}
                >
                  ACTIVATE: MAIN
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionChoiceCard(null);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
          setDifficultyMode={handleDifficultyChange}

          resetScenario={resetScenario}
          handleConcede={handleConcede}

          hasStartedAction={hasStartedAction}
          hasWon={hasWon}
          hasLost={hasLost}
          hasConceded={hasConceded}

          loadTodayChallenge={loadTodayChallenge}
          disableDifficultyChange={isDailyAttemptLocked}
          disableLoadToday={isDailyAttemptLocked}

          canSkipEffectStep={canSkipCurrentEffectStep}
          onSkipEffectStep={skipCurrentOptionalEffectStep}

          selectedArchiveDate={selectedArchiveDate}
          loadArchiveChallenge={loadArchiveChallenge}
          challengeList={challengeList}

        />
      </div>
    </div>
  );
}

export default App;