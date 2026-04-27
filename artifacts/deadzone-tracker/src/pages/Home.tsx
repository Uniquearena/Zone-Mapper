import { useState } from "react";
import { Link } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { formatDistanceToNow } from "date-fns";
import { Crosshair, Plus, Filter, Activity } from "lucide-react";
import {
  useListDeadzones,
  useListRecentDeadzones,
  DeadzoneType,
  DeadzoneSeverity
} from "@workspace/api-client-react";

import { createCustomIcon } from "@/lib/map-icons";
import { TYPE_LABELS, SEVERITY_LABELS, SEVERITY_COLORS, TYPE_ICONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function MapEvents({ onMapClick }: { onMapClick: (e: any) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e);
    }
  });
  return null;
}

export default function Home() {
  const [filterType, setFilterType] = useState<DeadzoneType | "">("");
  const [filterSeverity, setFilterSeverity] = useState<DeadzoneSeverity | "">("");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clickLocation, setClickLocation] = useState<{lat: number, lng: number} | null>(null);

  const { data: deadzones } = useListDeadzones({
    type: filterType || undefined,
    severity: filterSeverity || undefined
  });

  const { data: recent } = useListRecentDeadzones({ limit: 10 });

  const handleMapClick = (e: any) => {
    setClickLocation(e.latlng);
    setCreateDialogOpen(true);
  };

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar - Recent Reports */}
      <div className="w-full md:w-80 border-r border-border bg-card flex flex-col z-10 shrink-0 shadow-lg order-2 md:order-1 h-64 md:h-auto md:min-h-0">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-mono font-bold flex items-center gap-2 text-primary">
            <Activity className="h-4 w-4" />
            RECENT ACTIVITY
          </h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {recent?.map(report => {
              const Icon = TYPE_ICONS[report.type];
              return (
                <Link key={report.id} href={`/reports/${report.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-colors bg-background/50 cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm truncate max-w-[150px]">{report.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${SEVERITY_COLORS[report.severity]}`}>
                          {SEVERITY_LABELS[report.severity]}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {report.carrier}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
            {recent?.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No recent reports</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative order-1 md:order-2 h-full min-h-[300px]">
        {/* Floating Filters */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col sm:flex-row gap-2">
          <div className="bg-background/90 backdrop-blur border border-border rounded-md p-1 flex gap-2 shadow-lg">
            <div className="flex items-center px-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as DeadzoneType | "")}>
              <SelectTrigger className="w-[140px] h-8 bg-transparent border-0 focus:ring-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px bg-border my-1" />
            <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as DeadzoneSeverity | "")}>
              <SelectTrigger className="w-[140px] h-8 bg-transparent border-0 focus:ring-0">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-[400]">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg h-14 px-6 font-mono font-bold hover:scale-105 transition-transform"
            onClick={() => { setClickLocation(null); setCreateDialogOpen(true); }}
          >
            <Crosshair className="mr-2 h-5 w-5" />
            REPORT DEADZONE
          </Button>
        </div>

        <MapContainer 
          center={[39.8283, -98.5795]} 
          zoom={4} 
          style={{ height: "100%", width: "100%", background: "#0a0d14" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
          />
          <MapEvents onMapClick={handleMapClick} />
          
          {deadzones?.map(report => (
            <Marker 
              key={report.id} 
              position={[report.latitude, report.longitude]}
              icon={createCustomIcon(report.type, report.severity)}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-2 min-w-[200px]">
                  <h3 className="font-bold text-sm leading-tight">{report.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 ${SEVERITY_COLORS[report.severity]}`}>
                      {SEVERITY_LABELS[report.severity]}
                    </Badge>
                    <span className="text-xs font-mono">{report.carrier}</span>
                  </div>
                  <Link href={`/reports/${report.id}`}>
                    <Button size="sm" variant="secondary" className="w-full h-7 text-xs mt-2">
                      View Intel
                    </Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
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
