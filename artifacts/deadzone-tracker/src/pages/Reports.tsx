import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import {
  useListDeadzones,
  DeadzoneType,
  DeadzoneSeverity
} from "@workspace/api-client-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, SEVERITY_LABELS, SEVERITY_COLORS, TYPE_ICONS } from "@/lib/constants";

export default function Reports() {
  const [filterType, setFilterType] = useState<DeadzoneType | "">("");
  const [filterSeverity, setFilterSeverity] = useState<DeadzoneSeverity | "">("");
  const [search, setSearch] = useState("");

  const { data: deadzones, isLoading } = useListDeadzones({
    type: filterType || undefined,
    severity: filterSeverity || undefined
  });

  const filteredDeadzones = deadzones?.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.carrier.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-8 px-4 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight text-primary">SIGNAL INTEL LOG</h1>
          <p className="text-muted-foreground mt-1">Browse all reported deadzones across the grid.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search reports, carriers, keywords..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as DeadzoneType | "")}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as DeadzoneSeverity | "")}>
            <SelectTrigger className="w-[150px] bg-background">
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

      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs w-[300px]">INCIDENT</TableHead>
              <TableHead className="font-mono text-xs">TYPE</TableHead>
              <TableHead className="font-mono text-xs">SEVERITY</TableHead>
              <TableHead className="font-mono text-xs">CARRIER</TableHead>
              <TableHead className="font-mono text-xs text-right">SIGNAL</TableHead>
              <TableHead className="font-mono text-xs text-right">DATE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Intercepting signals...
                </TableCell>
              </TableRow>
            ) : filteredDeadzones?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No deadzones found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeadzones?.map((report) => {
                const Icon = TYPE_ICONS[report.type];
                return (
                  <TableRow key={report.id} className="hover:bg-muted/30 transition-colors group cursor-pointer relative">
                    <TableCell className="font-medium">
                      <Link href={`/reports/${report.id}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View report {report.id}</span>
                      </Link>
                      <span className="group-hover:text-primary transition-colors">{report.title}</span>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        {TYPE_LABELS[report.type]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SEVERITY_COLORS[report.severity]}>
                        {SEVERITY_LABELS[report.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{report.carrier}</TableCell>
                    <TableCell className="font-mono text-xs text-right text-muted-foreground">
                      {report.signalStrength != null ? `${report.signalStrength} dBm` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
