import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import {
  Crosshair,
  Filter,
  Activity,
  LocateFixed,
  Loader2,
  Layers,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  useListDeadzones,
  useListRecentDeadzones,
  DeadzoneType,
  DeadzoneSeverity,
} from "@workspace/api-client-react";

import {
  createCustomIcon,
  createUserLocationIcon,
} from "@/lib/map-icons";
import {
  TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  TYPE_ICONS,
  INDIA_CENTER,
  INDIA_ZOOM,
  severityToHeatWeight,
  dbmToHeatWeight,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { ClusterInsightsPanel } from "@/components/ClusterInsightsPanel";
import { useToast } from "@/hooks/use-toast";

function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e);
    },
  });
  return null;
}

function MapController({
  target,
  onConsumed,
}: {
  target: { lat: number; lng: number; zoom?: number } | null;
  onConsumed: () => void;
}) {
  const map = useMapEvents({});
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom ?? 12, {
        duration: 1.2,
      });
      onConsumed();
    }
  }, [target, map, onConsumed]);
  return null;
}

export default function Home() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<DeadzoneType | "">("");
  const [filterSeverity, setFilterSeverity] = useState<DeadzoneSeverity | "">("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clickLocation, setClickLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const { data: deadzones } = useListDeadzones({
    type: filterType || undefined,
    severity: filterSeverity || undefined,
  });

  const { data: recent } = useListRecentDeadzones({ limit: 10 });

  const heatPoints = useMemo<[number, number, number][]>(() => {
    if (!deadzones) return [];
    return deadzones.map((d) => {
      const sevWeight = severityToHeatWeight(d.severity);
      const dbmWeight = dbmToHeatWeight(d.signalStrength ?? null);
      // Combine: bias slightly toward dBm when present
      const w = d.signalStrength != null ? (sevWeight + dbmWeight) / 2 : sevWeight;
      return [d.latitude, d.longitude, Math.max(0.1, Math.min(1, w))];
    });
  }, [deadzones]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    setClickLocation(e.latlng);
    setCreateDialogOpen(true);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation unsupported",
        description: "Your browser does not support location access.",
        variant: "destructive",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setFlyTarget({ ...loc, zoom: 13 });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast({
          title: "Location unavailable",
          description: err.message || "Could not determine your position.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border bg-card flex flex-col z-10 shrink-0 shadow-lg order-2 md:order-1 h-72 md:h-auto md:min-h-0">
        <Tabs defaultValue="recent" className="flex flex-col h-full">
          <TabsList className="grid grid-cols-2 m-2 mb-0 shrink-0">
            <TabsTrigger value="recent" className="font-mono text-xs">
              <Activity className="h-3 w-3 mr-1" /> RECENT
            </TabsTrigger>
            <TabsTrigger value="clusters" className="font-mono text-xs">
              <Crosshair className="h-3 w-3 mr-1" /> CLUSTERS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="flex-1 mt-0 min-h-0 flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-mono font-bold flex items-center gap-2 text-primary text-sm">
                <Activity className="h-4 w-4" />
                RECENT ACTIVITY
              </h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {recent?.map((report) => {
                  const Icon = TYPE_ICONS[report.type];
                  return (
                    <Link
                      key={report.id}
                      href={`/reports/${report.id}`}
                      className="block"
                    >
                      <Card className="hover:border-primary/50 transition-colors bg-background/50 cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-sm truncate">
                                {report.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono ml-2">
                              {formatDistanceToNow(new Date(report.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 ${SEVERITY_COLORS[report.severity]}`}
                            >
                              {SEVERITY_LABELS[report.severity]}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {report.carrier}
                            </span>
                            {report.signalStrength != null && (
                              <span className="text-xs text-muted-foreground font-mono ml-auto">
                                {report.signalStrength} dBm
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
                {recent?.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No recent reports
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="clusters" className="flex-1 mt-0 min-h-0">
            <ClusterInsightsPanel
              onSelect={(lat, lng) => setFlyTarget({ lat, lng, zoom: 12 })}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative order-1 md:order-2 h-full min-h-[300px]">
        {/* Floating Filters */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap gap-2 pointer-events-none">
          <div className="bg-background/90 backdrop-blur border border-border rounded-md p-1 flex gap-1 shadow-lg pointer-events-auto">
            <div className="flex items-center px-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
            </div>
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v === "all" ? "" : (v as DeadzoneType))}
            >
              <SelectTrigger className="w-[130px] h-8 bg-transparent border-0 focus:ring-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px bg-border my-1" />
            <Select
              value={filterSeverity}
              onValueChange={(v) =>
                setFilterSeverity(v === "all" ? "" : (v as DeadzoneSeverity))
              }
            >
              <SelectTrigger className="w-[140px] h-8 bg-transparent border-0 focus:ring-0">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-background/90 backdrop-blur border border-border rounded-md p-1 flex gap-1 shadow-lg pointer-events-auto">
            <Button
              variant={showHeatmap ? "secondary" : "ghost"}
              size="sm"
              className="h-8 font-mono text-xs"
              onClick={() => setShowHeatmap((v) => !v)}
              title="Toggle heatmap"
            >
              <Layers className="h-3.5 w-3.5 mr-1" />
              Heat
            </Button>
            <Button
              variant={showMarkers ? "secondary" : "ghost"}
              size="sm"
              className="h-8 font-mono text-xs"
              onClick={() => setShowMarkers((v) => !v)}
              title="Toggle markers"
            >
              {showMarkers ? (
                <Eye className="h-3.5 w-3.5 mr-1" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 mr-1" />
              )}
              Pins
            </Button>
            <div className="w-px bg-border my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-mono text-xs"
              onClick={locateMe}
              disabled={locating}
              title="Show my location"
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <LocateFixed className="h-3.5 w-3.5 mr-1" />
              )}
              Locate
            </Button>
          </div>
        </div>

        {/* Heatmap legend */}
        <div className="absolute bottom-6 left-4 z-[400] bg-background/90 backdrop-blur border border-border rounded-md p-3 shadow-lg text-[10px] font-mono">
          <div className="font-bold text-muted-foreground mb-1.5">SIGNAL HEAT</div>
          <div
            className="h-2 w-32 rounded mb-1"
            style={{
              background:
                "linear-gradient(to right,#22c55e 0%,#a3e635 35%,#eab308 55%,#f97316 75%,#ef4444 100%)",
            }}
          />
          <div className="flex justify-between text-muted-foreground">
            <span>Strong</span>
            <span>Dead</span>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-[400]">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 px-6 font-mono font-bold hover:scale-105 transition-transform"
            onClick={() => {
              setClickLocation(null);
              setCreateDialogOpen(true);
            }}
          >
            <Crosshair className="mr-2 h-5 w-5" />
            REPORT DEADZONE
          </Button>
        </div>

        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={4}
          maxBounds={[
            [5, 65],
            [38, 100],
          ]}
          maxBoundsViscosity={0.6}
          style={{ height: "100%", width: "100%", background: "#0a0d14" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://carto.com/">Carto</a> &copy; OpenStreetMap'
          />
          <MapEvents onMapClick={handleMapClick} />
          <MapController target={flyTarget} onConsumed={() => setFlyTarget(null)} />

          {showHeatmap && heatPoints.length > 0 && (
            <HeatmapLayer points={heatPoints} radius={28} blur={22} />
          )}

          {showMarkers &&
            deadzones?.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createCustomIcon(report.type, report.severity)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2 min-w-[220px]">
                    <h3 className="font-bold text-sm leading-tight">
                      {report.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 ${SEVERITY_COLORS[report.severity]}`}
                      >
                        {SEVERITY_LABELS[report.severity]}
                      </Badge>
                      <span className="text-xs font-mono">{report.carrier}</span>
                      {report.signalStrength != null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {report.signalStrength} dBm
                        </span>
                      )}
                    </div>
                    <Link href={`/reports/${report.id}`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full h-7 text-xs mt-2"
                      >
                        View Intel
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
            >
              <Popup>
                <div className="text-xs font-mono">
                  Your location
                  <br />
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <CreateReportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialLocation={clickLocation || undefined}
      />
    </div>
  );
}
