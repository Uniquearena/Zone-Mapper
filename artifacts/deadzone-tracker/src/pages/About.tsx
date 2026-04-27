import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function About() {
  return (
    <div className="container max-w-4xl py-12 px-4 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-mono font-bold tracking-tight uppercase border-b border-primary/30 pb-4 inline-block text-primary">
          System Overview
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Deadzone Tracker is an open-source intelligence (OSINT) tool for mapping areas where modern connectivity fails. We crowdsource signal drops, GPS anomalies, and complete grid blackouts to build a realistic picture of infrastructure reality.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-mono font-bold text-foreground">Why We Build This</h2>
            <p className="text-muted-foreground leading-relaxed">
              Carrier maps show "5 bars" everywhere. The reality is different. Road-trippers lose navigation in canyons, remote workers hunt for cafe Wi-Fi that actually works, and hikers plan routes relying on coverage that doesn't exist. This tool is for documenting the gaps.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-mono font-bold text-foreground">How To Contribute</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you find a spot with zero connectivity, remember the location. Once you have signal again, drop a pin on the map. Categorize the type of failure (Cellular, GPS, Wi-Fi) and the severity. Your data helps others avoid or prepare for the same blackouts.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-6">
        <h2 className="text-2xl font-mono font-bold">Severity Matrix</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { level: "Low Impact", color: "text-severity-low border-severity-low", bg: "bg-severity-low/10", desc: "Noticeable degradation but basic connectivity remains. Slow data." },
            { level: "Degraded", color: "text-severity-medium border-severity-medium", bg: "bg-severity-medium/10", desc: "Frequent drops, unable to stream or use demanding applications." },
            { level: "Severe Drop", color: "text-severity-high border-severity-high", bg: "bg-severity-high/10", desc: "Intermittent connection at best. Texts might go through eventually. Calls drop." },
            { level: "Total Deadzone", color: "text-severity-total border-severity-total", bg: "bg-severity-total/10", desc: "Zero connectivity. No signal whatsoever." }
          ].map(sev => (
            <div key={sev.level} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/30">
              <Badge variant="outline" className={`${sev.color} ${sev.bg} font-mono mt-1`}>{sev.level}</Badge>
              <p className="text-sm text-muted-foreground">{sev.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
