import { 
  useGetStatsSummary, 
  useGetHotspots, 
  useGetCarrierStats,
  getGetStatsSummaryQueryKey,
  getGetHotspotsQueryKey,
  getGetCarrierStatsQueryKey
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Activity, Radio, Signal, MapPin, Users, Globe, BarChart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TYPE_LABELS, SEVERITY_LABELS, SEVERITY_HEX } from "@/lib/constants";

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: any, description: string }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-mono font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const { data: summary, isLoading: loadingSummary } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() }
  });
  
  const { data: hotspots, isLoading: loadingHotspots } = useGetHotspots({ limit: 5 }, {
    query: { queryKey: getGetHotspotsQueryKey({ limit: 5 }) }
  });

  const { data: carriers, isLoading: loadingCarriers } = useGetCarrierStats({
    query: { queryKey: getGetCarrierStatsQueryKey() }
  });

  const severityData = summary?.bySeverity.map(s => ({
    name: SEVERITY_LABELS[s.severity],
    count: s.count,
    color: SEVERITY_HEX[s.severity]
  }));

  const typeData = summary?.byType.map(t => ({
    name: TYPE_LABELS[t.type],
    count: t.count
  }));

  return (
    <div className="container py-8 px-4 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          NETWORK INTELLIGENCE
        </h1>
        <p className="text-muted-foreground mt-1">Aggregated analytics from all field reports.</p>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="TOTAL REPORTS" 
            value={summary.totalReports} 
            icon={Activity} 
            description="Incidents logged" 
          />
          <StatCard 
            title="VERIFICATIONS" 
            value={summary.totalConfirmations} 
            icon={Users} 
            description="Total confirmations" 
          />
          <StatCard 
            title="CARRIERS AFFECTED" 
            value={summary.uniqueCarriers} 
            icon={Radio} 
            description="Unique service providers" 
          />
          <StatCard 
            title="ACTIVE CITIES" 
            value={summary.activeCities} 
            icon={Globe} 
            description="Areas with reported drops" 
          />
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-mono">SEVERITY DISTRIBUTION</CardTitle>
            <CardDescription>Breakdown of signal failure impact</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {severityData && severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={severityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-mono">NO DATA</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-mono">FAILURE TYPES</CardTitle>
            <CardDescription>Incidents grouped by technology</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
             {typeData && typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={typeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-mono">NO DATA</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="font-mono">CARRIER LEADERBOARD</CardTitle>
            <CardDescription>Providers with the most reported failures</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCarriers ? (
              <div className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-mono text-xs">PROVIDER</TableHead>
                    <TableHead className="font-mono text-xs text-right">REPORTS</TableHead>
                    <TableHead className="font-mono text-xs text-right">AVG VERIFICATIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers?.map((c) => (
                    <TableRow key={c.carrier} className="border-border/50">
                      <TableCell className="font-medium font-mono">{c.carrier}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {c.avgConfirmations.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!carriers || carriers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-primary/5">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <MapPin className="h-5 w-5 text-destructive" />
              TOP HOTSPOTS
            </CardTitle>
            <CardDescription>Geographic clusters of failure</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHotspots ? (
              <div className="space-y-4"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div>
            ) : (
              <div className="space-y-4">
                {hotspots?.map((spot, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/50 bg-card shadow-sm flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{spot.label}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-mono">
                        {TYPE_LABELS[spot.topType]} Dominant
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-destructive">{spot.count}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Reports</div>
                    </div>
                  </div>
                ))}
                {(!hotspots || hotspots.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground text-sm font-mono">No hotspots detected</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
