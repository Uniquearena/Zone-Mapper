import { useEffect, useRef, useState } from "react";
import {
  useGetRoutes,
  getGetRoutesQueryKey,
  type RouteComparison,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Route,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Crosshair,
  XCircle,
  Trophy,
  Search,
} from "lucide-react";

type Point = { lat: number; lng: number; label: string };

interface NominatimHit {
  display_name: string;
  lat: string;
  lon: string;
}

async function geocodeIndia(query: string): Promise<NominatimHit[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "json",
      countrycodes: "in",
      limit: "5",
      addressdetails: "0",
    });
  const r = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!r.ok) return [];
  return (await r.json()) as NominatimHit[];
}

function PlaceInput({
  label,
  placeholder,
  value,
  onSelect,
  onClear,
}: {
  label: string;
  placeholder: string;
  value: Point | null;
  onSelect: (p: Point) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NominatimHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.label);
      setOpen(false);
    }
  }, [value]);

  const handleChange = (v: string) => {
    setQuery(v);
    if (value) onClear();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) {
      setHits([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await geocodeIndia(v);
        setHits(results);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="space-y-1 relative">
      <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="h-9 pl-7 pr-7 text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {loading && (
          <Loader2 className="absolute right-2 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onClear();
              setHits([]);
              setOpen(false);
            }}
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && hits.length > 0 && (
        <div className="absolute z-[600] mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-56 overflow-auto">
          {hits.map((h, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-accent border-b border-border/50 last:border-b-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect({
                  lat: parseFloat(h.lat),
                  lng: parseFloat(h.lon),
                  label: h.display_name,
                });
                setOpen(false);
              }}
            >
              {h.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  onResult: (data: RouteComparison | null) => void;
  onSelectRoute: (id: number) => void;
  selectedRouteId: number | null;
  onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
}

const STATUS_COLOR: Record<string, string> = {
  strong: "text-severity-low",
  moderate: "text-severity-medium",
  dead: "text-severity-total",
  unknown: "text-muted-foreground",
};

export function RoutePlanner({
  onResult,
  onSelectRoute,
  selectedRouteId,
  onFlyTo,
}: Props) {
  const { toast } = useToast();
  const [from, setFrom] = useState<Point | null>(null);
  const [to, setTo] = useState<Point | null>(null);

  const enabled = !!(from && to);

  const [submitted, setSubmitted] = useState<{
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  } | null>(null);

  const { data, isFetching, error } = useGetRoutes(
    submitted ?? { fromLat: 0, fromLng: 0, toLat: 0, toLng: 0 },
    {
      query: {
        enabled: !!submitted,
        queryKey: submitted
          ? getGetRoutesQueryKey(submitted)
          : getGetRoutesQueryKey({
              fromLat: 0,
              fromLng: 0,
              toLat: 0,
              toLng: 0,
            }),
        staleTime: 60000,
        retry: false,
      },
    },
  );

  useEffect(() => {
    onResult(data ?? null);
    if (data && data.routes.length > 0) {
      onSelectRoute(data.recommendedId);
    }
  }, [data, onResult, onSelectRoute]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Routing failed",
        description:
          "Could not reach the routing provider. Try again in a moment.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const useMyLocationFor = (which: "from" | "to") => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: Point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "My location",
        };
        if (which === "from") setFrom(p);
        else setTo(p);
      },
      () => {
        toast({
          title: "Location unavailable",
          variant: "destructive",
        });
      },
    );
  };

  const handleFind = () => {
    if (!enabled || !from || !to) return;
    setSubmitted({
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-muted/30">
        <h2 className="font-mono font-bold flex items-center gap-2 text-primary text-sm">
          <Route className="h-4 w-4" />
          SMART ROUTING
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono">
          Picks the route with the best signal
        </p>
      </div>

      <div className="p-3 space-y-3 border-b border-border bg-card">
        <div className="space-y-1">
          <PlaceInput
            label="From"
            placeholder="e.g. Mumbai Central"
            value={from}
            onSelect={setFrom}
            onClear={() => setFrom(null)}
          />
          <button
            type="button"
            className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
            onClick={() => useMyLocationFor("from")}
          >
            <Crosshair className="h-3 w-3" /> use my location
          </button>
        </div>
        <PlaceInput
          label="To"
          placeholder="e.g. Pune Station"
          value={to}
          onSelect={setTo}
          onClear={() => setTo(null)}
        />
        <Button
          size="sm"
          className="w-full font-mono"
          disabled={!enabled || isFetching}
          onClick={handleFind}
        >
          {isFetching ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Scoring routes...
            </>
          ) : (
            <>
              <ArrowRight className="h-3.5 w-3.5 mr-2" />
              Find Routes
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {!data && !isFetching && (
            <div className="text-xs text-muted-foreground text-center py-8 font-mono">
              Pick a source and destination,
              <br />
              then tap "Find Routes".
            </div>
          )}

          {data?.routes.map((route) => {
            const isRec = route.id === data.recommendedId;
            const isShort = route.id === data.shortestId;
            const isSelected = route.id === selectedRouteId;
            const total = route.segments.length;
            return (
              <Card
                key={route.id}
                className={`bg-background/50 cursor-pointer transition-colors hover-elevate active-elevate-2 ${
                  isSelected
                    ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                    : "border-border"
                }`}
                onClick={() => {
                  onSelectRoute(route.id);
                  if (route.geometry.length > 0 && onFlyTo) {
                    const mid = route.geometry[Math.floor(route.geometry.length / 2)];
                    onFlyTo(mid[0], mid[1], 9);
                  }
                }}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{
                          background:
                            route.id === 0
                              ? "#3b82f6"
                              : route.id === 1
                                ? "#a855f7"
                                : "#ec4899",
                        }}
                      />
                      <span className="font-mono text-xs font-bold truncate">
                        {route.label}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {isRec && (
                        <Badge className="text-[9px] px-1.5 py-0 font-mono bg-primary/20 text-primary border border-primary/40">
                          <Trophy className="h-2.5 w-2.5 mr-0.5" />
                          BEST SIGNAL
                        </Badge>
                      )}
                      {isShort && !isRec && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 font-mono"
                        >
                          SHORTEST
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div>
                      <div className="text-base font-bold font-mono">
                        {route.distanceKm.toFixed(0)}
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        km
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold font-mono">
                        {route.durationMin >= 60
                          ? `${(route.durationMin / 60).toFixed(1)}h`
                          : `${Math.round(route.durationMin)}m`}
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        ETA
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-base font-bold font-mono ${
                          route.signalScore >= 75
                            ? "text-severity-low"
                            : route.signalScore >= 50
                              ? "text-severity-medium"
                              : "text-severity-total"
                        }`}
                      >
                        {route.signalScore}
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        Signal
                      </div>
                    </div>
                  </div>

                  {/* Segment bar */}
                  <div className="flex h-2 rounded overflow-hidden border border-border/50">
                    {route.segments.map((s, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{
                          background:
                            s.status === "dead"
                              ? "#ef4444"
                              : s.status === "moderate"
                                ? "#eab308"
                                : s.status === "strong"
                                  ? "#22c55e"
                                  : "#475569",
                        }}
                        title={`${s.status}${s.avgSignal != null ? ` · ${s.avgSignal} dBm` : ""}`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                    <div className={`flex items-center gap-1 ${STATUS_COLOR.dead}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-severity-total" />
                      {route.deadCount}
                    </div>
                    <div
                      className={`flex items-center gap-1 ${STATUS_COLOR.moderate}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-severity-medium" />
                      {route.moderateCount}
                    </div>
                    <div className={`flex items-center gap-1 ${STATUS_COLOR.strong}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-severity-low" />
                      {route.strongCount}
                    </div>
                    <div
                      className={`flex items-center gap-1 ${STATUS_COLOR.unknown}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                      {route.unknownCount}
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/50">
                    Sampled {total} points · {route.deadCount} dead-zone hits
                  </div>

                  {isRec && (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-mono pt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Recommended for connectivity
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
