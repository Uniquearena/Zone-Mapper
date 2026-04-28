import type { JourneyState } from "@/lib/journey";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldCheck,
  SignalZero,
  Play,
  Pause,
  Square,
  Navigation,
} from "lucide-react";

interface Props {
  state: JourneyState | null;
  isSimulating: boolean;
  isPaused: boolean;
  hasRoute: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function RouteAlertBanner({
  state,
  isSimulating,
  isPaused,
  hasRoute,
  onStart,
  onPause,
  onStop,
}: Props) {
  if (!hasRoute) return null;

  const inDead = state?.currentStatus === "dead";
  const inModerate = state?.currentStatus === "moderate";
  const nextDead = state?.nextDead;
  const nextWeak = state?.nextWeak;

  // Choose the banner content based on priority:
  // 1. In dead zone → critical red banner
  // 2. Dead zone ahead → warning yellow banner
  // 3. In moderate / weak ahead → soft moderate banner
  // 4. All clear → green banner
  let title = "Signal clear ahead";
  let subtitle = "No predicted dead zones in the next 8 km";
  let Icon = ShieldCheck;
  let tone: "ok" | "warn" | "danger" = "ok";

  if (inDead) {
    Icon = SignalZero;
    title = "You are in a dead zone";
    subtitle =
      nextWeak && nextWeak.segment.status === "moderate"
        ? `Signal recovers around ${nextWeak.distanceKm.toFixed(1)} km`
        : "Signal expected to recover shortly";
    tone = "danger";
  } else if (nextDead) {
    Icon = AlertTriangle;
    title = `Dead zone ahead in ${nextDead.distanceKm.toFixed(1)} km`;
    subtitle =
      nextDead.segment.avgSignal != null
        ? `Predicted ${nextDead.segment.avgSignal.toFixed(0)} dBm`
        : "Predicted no signal — make calls now";
    tone = "warn";
  } else if (inModerate) {
    Icon = AlertTriangle;
    title = "Weak signal area";
    subtitle = nextWeak
      ? `Heads up — patchy coverage around ${nextWeak.distanceKm.toFixed(1)} km`
      : "Patchy coverage";
    tone = "warn";
  } else if (nextWeak) {
    Icon = AlertTriangle;
    title = `Weak signal in ${nextWeak.distanceKm.toFixed(1)} km`;
    subtitle = "Heads up — patchy coverage ahead";
    tone = "warn";
  }

  const toneClasses =
    tone === "danger"
      ? "bg-severity-total/15 border-severity-total/60 text-severity-total"
      : tone === "warn"
        ? "bg-severity-medium/15 border-severity-medium/60 text-severity-medium"
        : "bg-severity-low/15 border-severity-low/60 text-severity-low";

  const progressPct =
    state && state.totalKm > 0
      ? Math.min(100, (state.progressKm / state.totalKm) * 100)
      : 0;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] w-[min(92%,420px)] pointer-events-none">
      <div
        className={`pointer-events-auto rounded-md border-2 backdrop-blur bg-card/85 shadow-2xl overflow-hidden ${toneClasses}`}
        data-testid="route-alert-banner"
      >
        <div className="px-3 py-2 flex items-start gap-2">
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-xs uppercase tracking-wider truncate">
              {title}
            </div>
            <div className="text-[11px] text-foreground/80 truncate font-mono">
              {subtitle}
            </div>
          </div>
          <Navigation className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
        {state && (
          <div className="px-3 pb-2 space-y-1.5">
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-150"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-foreground/70">
              <span>{state.progressKm.toFixed(1)} km</span>
              <span>{state.totalKm.toFixed(1)} km total</span>
            </div>
          </div>
        )}
        <div className="px-3 py-2 flex items-center gap-1.5 border-t border-current/20 bg-background/40">
          {!isSimulating ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono px-2"
              onClick={onStart}
              data-testid="button-simulate-start"
            >
              <Play className="h-3 w-3 mr-1" />
              {state && state.progressKm > 0
                ? "Resume sim"
                : "Simulate journey"}
            </Button>
          ) : isPaused ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono px-2"
              onClick={onStart}
              data-testid="button-simulate-resume"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono px-2"
              onClick={onPause}
              data-testid="button-simulate-pause"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}
          {(isSimulating || (state && state.progressKm > 0)) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-mono px-2 text-muted-foreground"
              onClick={onStop}
              data-testid="button-simulate-stop"
            >
              <Square className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {isSimulating
              ? isPaused
                ? "PAUSED"
                : "SIMULATING"
              : state && state.progressKm > 0
                ? "STOPPED"
                : "READY"}
          </span>
        </div>
      </div>
    </div>
  );
}
