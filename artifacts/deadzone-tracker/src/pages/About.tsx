import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CARRIERS, SEVERITY_DBM_HINT } from "@/lib/constants";
import { DeadzoneSeverity } from "@workspace/api-client-react";

export default function About() {
  return (
    <div className="container max-w-4xl py-12 px-4 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-mono font-bold tracking-tight uppercase border-b border-primary/30 pb-4 inline-block text-primary">
          Dead Zone Tracker · India
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A crowdsourced map of mobile and Wi-Fi dead zones across India.
          We collect signal-strength reports, GPS anomalies, and carrier
          blackouts so people can plan routes, work, and travel around
          areas where the network actually fails — not where carrier maps
          claim "5 bars".
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-mono font-bold text-foreground">
              Why India needs this
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Even with 5G rollouts in metros, dead zones plague metro
              tunnels, hill stations, basement parking, and high-density
              old city lanes. Carrier coverage maps rarely reflect reality
              once you step into a tunnel between Bandra and Worli, hike
              past Solang Valley, or try to scan a UPI QR in a packed
              stadium.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-mono font-bold text-foreground">
              How to contribute
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              When you hit a dead spot, note where it happened. Once
              signal is back, drop a pin. Pick the carrier, type, severity,
              and (if you can) signal strength in dBm. We deduplicate
              reports within 5 minutes and 50 metres so spam doesn't
              poison the map.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-6">
        <h2 className="text-2xl font-mono font-bold">Severity matrix</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              level: "Strong (Issue)",
              key: DeadzoneSeverity.low,
              color: "text-severity-low border-severity-low",
              bg: "bg-severity-low/10",
              desc: "Noticeable degradation but basic connectivity remains. Slow data, occasional drops.",
            },
            {
              level: "Weak Signal",
              key: DeadzoneSeverity.medium,
              color: "text-severity-medium border-severity-medium",
              bg: "bg-severity-medium/10",
              desc: "Frequent drops, can't stream. UPI may time out at peak times.",
            },
            {
              level: "Severe Drop",
              key: DeadzoneSeverity.high,
              color: "text-severity-high border-severity-high",
              bg: "bg-severity-high/10",
              desc: "Intermittent at best. SMS may go through eventually. Voice calls drop.",
            },
            {
              level: "Total Deadzone",
              key: DeadzoneSeverity.total,
              color: "text-severity-total border-severity-total",
              bg: "bg-severity-total/10",
              desc: "Zero connectivity across all carriers in the area.",
            },
          ].map((sev) => (
            <div
              key={sev.level}
              className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/30"
            >
              <Badge
                variant="outline"
                className={`${sev.color} ${sev.bg} font-mono mt-1 whitespace-nowrap`}
              >
                {sev.level}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{sev.desc}</p>
                <p className="text-xs font-mono text-muted-foreground/70 mt-1">
                  {SEVERITY_DBM_HINT[sev.key]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-4">
        <h2 className="text-2xl font-mono font-bold">Cluster confidence</h2>
        <p className="text-muted-foreground leading-relaxed">
          Reports are grouped using DBSCAN with a 2-km radius (minPts 2) so
          isolated noise points are filtered out. Each cluster carries a
          confidence score that combines: recency (7-day half-life),
          severity rank, and the number of independent confirmations on
          each report. The result is squashed into 0–100% so a small group
          of fresh, confirmed reports outranks a stale crowd.
        </p>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-4">
        <h2 className="text-2xl font-mono font-bold">
          Tracked Indian carriers
        </h2>
        <div className="flex flex-wrap gap-2">
          {CARRIERS.map((c) => (
            <Badge
              key={c}
              variant="outline"
              className="font-mono text-sm px-3 py-1 border-primary/30"
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
