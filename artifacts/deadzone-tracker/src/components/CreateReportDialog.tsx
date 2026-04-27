import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateDeadzone,
  DeadzoneType,
  DeadzoneSeverity,
  getListDeadzonesQueryKey,
  getListRecentDeadzonesQueryKey,
  getGetStatsSummaryQueryKey,
  getGetHotspotsQueryKey,
  getGetCarrierStatsQueryKey,
  getGetClustersQueryKey,
} from "@workspace/api-client-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_DBM_HINT,
  CARRIERS,
  INDIA_CENTER,
  INDIA_ZOOM,
} from "@/lib/constants";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  type: z.nativeEnum(DeadzoneType),
  severity: z.nativeEnum(DeadzoneSeverity),
  carrier: z.string().min(1, "Carrier is required"),
  reporter: z.string().min(1, "Reporter name is required"),
  address: z.string().optional(),
  signalStrength: z
    .number()
    .int()
    .min(-140, "Signal too low")
    .max(-30, "Signal too high")
    .optional(),
  latitude: z.number(),
  longitude: z.number(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: { lat: number; lng: number };
}

function LocationPicker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (p: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => setPosition(e.target.getLatLng()),
      }}
    />
  ) : null;
}

export function CreateReportDialog({
  open,
  onOpenChange,
  initialLocation,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDeadzone = useCreateDeadzone();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null,
  );

  useEffect(() => {
    if (initialLocation && !location) {
      setLocation(initialLocation);
    }
  }, [initialLocation, location]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: DeadzoneType.cellular,
      severity: DeadzoneSeverity.medium,
      carrier: "",
      reporter: "Anonymous",
      address: "",
      signalStrength: undefined,
      latitude: initialLocation?.lat || 0,
      longitude: initialLocation?.lng || 0,
    },
  });

  useEffect(() => {
    if (location) {
      form.setValue("latitude", location.lat);
      form.setValue("longitude", location.lng);
    }
  }, [location, form]);

  const currentSeverity = form.watch("severity");

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please pick a location on the map",
        variant: "destructive",
      });
      return;
    }

    createDeadzone.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Report submitted",
            description: "Your deadzone report has been recorded.",
          });
          onOpenChange(false);
          form.reset();
          setLocation(null);

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: getListDeadzonesQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getListRecentDeadzonesQueryKey({}),
          });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetHotspotsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getGetCarrierStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetClustersQueryKey() });
        },
        onError: (err: unknown) => {
          // Detect duplicate (HTTP 409)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (err as any)?.response?.status ?? (err as any)?.status;
          if (status === 409) {
            toast({
              title: "Duplicate report",
              description:
                "A nearby report from the same carrier was logged in the last 5 minutes.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Failed to submit",
              description: "Could not create report.",
              variant: "destructive",
            });
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-primary">
            Log New Deadzone
          </DialogTitle>
          <DialogDescription>
            Document a signal failure across India. Accurate reports help
            everyone navigate around bad coverage.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. No signal in Bandra Sea Link tunnel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier / Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARRIERS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Failure Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px] font-mono">
                      Typical: {SEVERITY_DBM_HINT[currentSeverity]}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What were you trying to do? How long did it last?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reporter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="signalStrength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signal (dBm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="-105"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? undefined : Number(v));
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] font-mono">
                      Optional · -50 strong · -120 dead
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landmark (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nearest cross street or landmark"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Location</div>
              <div className="text-xs text-muted-foreground mb-2">
                Click map to set pin (drag to fine-tune)
              </div>
              <div className="h-[200px] rounded-md overflow-hidden border border-border">
                <MapContainer
                  center={location ? [location.lat, location.lng] : INDIA_CENTER}
                  zoom={location ? 13 : INDIA_ZOOM}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <LocationPicker position={location} setPosition={setLocation} />
                </MapContainer>
              </div>
              {location && (
                <div className="text-xs font-mono text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-mono font-bold"
              disabled={createDeadzone.isPending}
            >
              {createDeadzone.isPending ? "Submitting..." : "LOG DEADZONE"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
