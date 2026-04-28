import { useEffect, useMemo, useRef, useState } from "react";
import type { RouteOption } from "@workspace/api-client-react";
import {
  computeJourneyState,
  cumulativeKm,
  pointAtKm,
  type JourneyState,
  type LatLng,
} from "@/lib/journey";

interface Args {
  route: RouteOption | null;
  realPosition: LatLng | null;
}

interface Controls {
  state: JourneyState | null;
  /** Active position (simulated takes priority over real). */
  activePosition: LatLng | null;
  isSimulating: boolean;
  isPaused: boolean;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
}

const SIMULATION_SECONDS = 30;
const TICK_MS = 100;

export function useRouteJourney({ route, realPosition }: Args): Controls {
  const [simKm, setSimKm] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset simulation if the route changes
  useEffect(() => {
    setSimKm(null);
    setIsSimulating(false);
    setIsPaused(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [route?.id, route?.geometry?.length]);

  const cum = useMemo(() => {
    if (!route) return null;
    return cumulativeKm(route.geometry as [number, number][]);
  }, [route]);

  const totalKm = cum ? cum[cum.length - 1] ?? 0 : 0;

  // Ticking simulation
  useEffect(() => {
    if (!isSimulating || isPaused || !route || !cum) return;
    const stepKm = totalKm / ((SIMULATION_SECONDS * 1000) / TICK_MS);
    tickRef.current = setInterval(() => {
      setSimKm((prev) => {
        const cur = prev ?? 0;
        const next = cur + stepKm;
        if (next >= totalKm) {
          // End of route → stop
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setIsSimulating(false);
          return totalKm;
        }
        return next;
      });
    }, TICK_MS);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isSimulating, isPaused, route, cum, totalKm]);

  const activePosition = useMemo<LatLng | null>(() => {
    if (simKm != null && route && cum) {
      return pointAtKm(route.geometry as [number, number][], cum, simKm).pos;
    }
    return realPosition;
  }, [simKm, route, cum, realPosition]);

  const state = useMemo<JourneyState | null>(() => {
    if (!route || !activePosition) return null;
    return computeJourneyState(route, activePosition);
  }, [route, activePosition]);

  return {
    state,
    activePosition,
    isSimulating,
    isPaused,
    startSimulation: () => {
      if (!route) return;
      if (simKm == null || simKm >= totalKm) setSimKm(0);
      setIsSimulating(true);
      setIsPaused(false);
    },
    pauseSimulation: () => {
      setIsPaused(true);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    },
    stopSimulation: () => {
      setIsSimulating(false);
      setIsPaused(false);
      setSimKm(null);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    },
  };
}
