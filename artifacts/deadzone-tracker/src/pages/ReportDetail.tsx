import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, ShieldAlert, Trash2, CheckCircle2, User, MapPin, Signal } from "lucide-react";
import {
  useGetDeadzone,
  useConfirmDeadzone,
  useDeleteDeadzone,
  getGetDeadzoneQueryKey,
  getListDeadzonesQueryKey,
  getListRecentDeadzonesQueryKey,
  getGetStatsSummaryQueryKey,
  getGetHotspotsQueryKey,
  getGetCarrierStatsQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TYPE_LABELS, SEVERITY_LABELS, SEVERITY_COLORS, TYPE_ICONS } from "@/lib/constants";
import { createCustomIcon } from "@/lib/map-icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading, isError } = useGetDeadzone(id, {
    query: { enabled: !!id, queryKey: getGetDeadzoneQueryKey(id) }
  });

  const confirmMutation = useConfirmDeadzone();
  const deleteMutation = useDeleteDeadzone();

  const handleConfirm = () => {
    confirmMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Signal confirmed", description: "Your confirmation has been logged." });
        queryClient.invalidateQueries({ queryKey: getGetDeadzoneQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCarrierStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not confirm signal.", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Record purged", description: "The deadzone report has been deleted." });
        queryClient.invalidateQueries({ queryKey: getListDeadzonesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentDeadzonesQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        setLocation("/reports");
      },
      onError: () => {
        toast({ title: "Error", description: "Could not delete report.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4 space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="container max-w-4xl py-20 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-mono font-bold">Signal Lost</h1>
        <p className="text-muted-foreground mt-2">This report could not be found or has been purged.</p>
        <Button variant="outline" className="mt-6" onClick={() => setLocation("/reports")}>
          Return to Grid
        </Button>
      </div>
    );
  }

  const Icon = TYPE_ICONS[report.type];

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> BACK
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className={`font-mono ${SEVERITY_COLORS[report.severity]}`}>
                <AlertTriangle className="mr-1 h-3 w-3" /> {SEVERITY_LABELS[report.severity]}
              </Badge>
              <Badge variant="secondary" className="font-mono bg-card border-border">
                <Icon className="mr-1 h-3 w-3" /> {TYPE_LABELS[report.type]}
              </Badge>
              <Badge variant="secondary" className="font-mono bg-primary/20 text-primary border-primary/30">
                {report.carrier}
              </Badge>
              {report.signalStrength != null && (
                <Badge variant="outline" className="font-mono">
                  <Signal className="mr-1 h-3 w-3" />
                  {report.signalStrength} dBm
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{report.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {report.reporter}</span>
              <span>•</span>
              <span>{format(new Date(report.createdAt), 'PPpp')}</span>
            </div>
          </div>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg font-mono text-primary">FIELD REPORT</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 items-center p-6 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex-1">
              <h3 className="font-mono font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                VERIFICATION
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {report.confirmations} {report.confirmations === 1 ? 'person has' : 'people have'} confirmed this deadzone is still active.
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto font-mono" 
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "VERIFYING..." : "CONFIRM STILL BAD"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border overflow-hidden">
            <CardHeader className="p-4 bg-muted/30 border-b border-border">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                COORDINATES
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </CardDescription>
            </CardHeader>
            <div className="h-64 relative bg-muted">
              <MapContainer 
                center={[report.latitude, report.longitude]} 
                zoom={14} 
                style={{ height: "100%", width: "100%", background: "#0a0d14" }}
                zoomControl={false}
                dragging={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={[report.latitude, report.longitude]}
                  icon={createCustomIcon(report.type, report.severity)}
                />
              </MapContainer>
            </div>
            {report.address && (
              <CardContent className="p-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">{report.address}</p>
              </CardContent>
            )}
          </Card>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> PURGE RECORD
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-destructive/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the deadzone report and remove the intel from the grid.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-mono">CANCEL</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono">
                  PURGE
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </div>
  );
}
