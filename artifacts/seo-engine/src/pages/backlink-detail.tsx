import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useGetBacklinkJob, getGetBacklinkJobQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function ScoreBadge({ score, label }: { score?: number | null, label?: string }) {
  if (!score) return <span className="text-muted-foreground">-</span>;
  let colorClass = "text-emerald-500";
  if (score < 40) colorClass = "text-destructive";
  else if (score < 70) colorClass = "text-yellow-500";
  
  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono font-bold ${colorClass}`}>{score}</span>
      {label && <span className="text-[10px] text-muted-foreground uppercase">{label}</span>}
    </div>
  );
}

export default function BacklinkDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id, 10);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading } = useGetBacklinkJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetBacklinkJobQueryKey(jobId) }
  });

  const copyPitch = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <Layout><div className="animate-pulse h-32 bg-accent rounded-lg" /></Layout>;
  }

  if (!data) {
    return <Layout><div>Job not found.</div></Layout>;
  }

  const { job, opportunities } = data;

  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight font-mono">{job.domain}</h1>
          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
            {job.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {job.niche && <span>Niche: <span className="font-medium text-foreground">{job.niche}</span></span>}
          <span>Opportunities: <span className="font-mono text-foreground">{job.opportunitiesFound || 0}</span></span>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target Domain</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Auth</TableHead>
              <TableHead className="text-center">Rel</TableHead>
              <TableHead className="text-center">Diff</TableHead>
              <TableHead>Contact / Pitch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities?.map((opp) => (
              <TableRow key={opp.id} className="hover:bg-accent/50 transition-colors">
                <TableCell>
                  <div className="font-medium text-primary font-mono text-sm">{opp.targetDomain}</div>
                  {opp.targetUrl && (
                    <a href={opp.targetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:underline mt-1">
                      View Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-accent">{opp.opportunityType}</Badge>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px] uppercase border-border/50">
                      {opp.status || 'new'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="bg-accent/10"><ScoreBadge score={opp.authorityScore} label="DA" /></TableCell>
                <TableCell className="bg-accent/20"><ScoreBadge score={opp.relevanceScore} label="Rel" /></TableCell>
                <TableCell className="bg-accent/10"><ScoreBadge score={opp.difficultyScore} label="Diff" /></TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="space-y-2">
                    {opp.contactEmail && (
                      <div className="text-sm font-mono bg-accent/50 px-2 py-1 rounded inline-block">{opp.contactEmail}</div>
                    )}
                    {opp.suggestedPitch && (
                      <div className="flex gap-2 items-start mt-2">
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1 italic bg-background p-2 rounded border border-border">
                          "{opp.suggestedPitch}"
                        </p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0" 
                          onClick={() => copyPitch(opp.id, opp.suggestedPitch!)}
                        >
                          {copiedId === opp.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!opportunities?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {job.status === 'completed' ? 'No opportunities found.' : 'Discovering opportunities...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Layout>
  );
}
