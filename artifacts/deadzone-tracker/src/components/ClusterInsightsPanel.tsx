import { formatDistanceToNow } from "date-fns";
import { Activity, Crosshair, Radio, ShieldCheck } from "lucide-react";
import {
  useGetClusters,
  getGetClustersQueryKey,
  DeadzoneSeverity,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";

interface Props {
  onSelect?: (lat: number, lng: number) => void;
}

export function ClusterInsightsPanel({ onSelect }: Props) {
  const { data: clusters, isLoading } = useGetClusters(
    { epsKm: 5, minPts: 2 },
    {
      query: {
        queryKey: getGetClustersQueryKey({ epsKm: 5, minPts: 2 }),
        refetchInterval: 30000,
      },
    },
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-muted/30">
        <h2 className="font-mono font-bold flex items-center gap-2 text-primary">
          <Activity className="h-4 w-4" />
          DEAD ZONE CLUSTERS
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono">
          DBSCAN · ε=5km · minPts=2
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}
          {!isLoading && clusters && clusters.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8 font-mono">
              No clusters detected.
              <br />
              Need at least 2 reports within 2km.
            </div>
          )}
          {clusters?.map((c) => {
            const sev = c.topSeverity as DeadzoneSeverity;
            const confidencePct = Math.round(c.confidence * 100);
            return (
              <Card
                key={c.id}
                className="bg-background/50 border-border hover-elevate active-elevate-2 cursor-pointer transition-colors"
                onClick={() => onSelect?.(c.centroidLat, c.centroidLng)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Crosshair className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono text-xs truncate">
                        {c.centroidLat.toFixed(3)}, {c.centroidLng.toFixed(3)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-mono ${SEVERITY_COLORS[sev]}`}
                    >
                      {SEVERITY_LABELS[sev]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold font-mono text-foreground">
                        {c.count}
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        Reports
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold font-mono text-foreground">
                        {confidencePct}%
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        Confidence
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold font-mono text-foreground">
                        {c.radiusKm < 1
                          ? `${(c.radiusKm * 1000).toFixed(0)}m`
                          : `${c.radiusKm.toFixed(1)}km`}
                      </div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">
                        Radius
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Radio className="h-3 w-3" />
                      {c.topCarrier}
                    </span>
                    {c.avgSignalStrength != null && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {Math.round(c.avgSignalStrength)} dBm
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(c.lastUpdated), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Confidence bar */}
                  <div className="h-1 bg-border/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
