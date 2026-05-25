import { useEffect, useRef } from "react";
import { shouldUseHoverPreview } from "../utils/device";

export default function CardTile({
  card,
  hidden = false,
  variant = "board",
  setHoveredCard,
  onClick,
  onMobilePreview,
  powerValue,
  attachedDonCount = 0,
  disableHoverPreview = false
}) {
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  const className = `card-tile ${variant} ${card?.rested ? "rested" : ""}`;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showDesktopPreview = () => {
    if (!card || hidden || disableHoverPreview) return;

    const recentlyTouched = Date.now() - lastTouchTimeRef.current < 1000;
    if (recentlyTouched) return;

    if (shouldUseHoverPreview()) {
      setHoveredCard?.(card);
    }
  };

  const hideDesktopPreview = () => {
    setHoveredCard?.(null);
  };

  const startLongPress = () => {
    if (!card || hidden) return;

    lastTouchTimeRef.current = Date.now();
    clearLongPressTimer();
    setHoveredCard?.(null);
    longPressTriggeredRef.current = false;

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setHoveredCard?.(null);
      onMobilePreview?.(card);
    }, 350);
  };

  const cancelLongPress = () => {
    clearLongPressTimer();

    window.setTimeout(() => {
      longPressTriggeredRef.current = false;
    }, 250);
  };

  const handleClick = (event) => {
    setHoveredCard?.(null);

    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(card);
  };

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  if (hidden) {
    return (
      <div
        className={`${className} real-card-back`}
        onContextMenu={(event) => event.preventDefault()}
      >
        <img
          src="/images/card_back.png"
          alt="Hidden card"
          className="card-image"
          draggable={false}
        />
      </div>
    );
  }

  if (!card) {
    return <div className={`${className} card-empty`} />;
  }

  return (
    <div
      className={className}
      onMouseEnter={showDesktopPreview}
      onMouseLeave={hideDesktopPreview}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      onContextMenu={(event) => event.preventDefault()}
      onClick={handleClick}
    >
      {card.image ? (
        <img
          src={card.image}
          alt={card.name}
          className="card-image"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
      ) : (
        <div className="card-missing-image">
          {card.name || card.cardId || "Missing Card"}
        </div>
      )}

      {powerValue ? <div className="power-badge">{powerValue}</div> : null}

      {attachedDonCount > 0 ? (
        <div className="attached-don-badge">+{attachedDonCount} DON</div>
      ) : null}
    </div>
  );
}