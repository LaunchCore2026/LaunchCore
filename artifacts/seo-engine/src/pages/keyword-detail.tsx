import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useGetKeywordJob, getGetKeywordJobQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return null;
  const i = intent.toLowerCase();
  if (i.includes('commercial') || i.includes('transactional')) {
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{intent}</Badge>;
  }
  if (i.includes('informational')) {
    return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{intent}</Badge>;
  }
  return <Badge variant="outline">{intent}</Badge>;
}

function ScoreBadge({ score }: { score?: number | null }) {
  if (!score) return <span>-</span>;
  let colorClass = "text-emerald-500";
  if (score < 40) colorClass = "text-destructive";
  else if (score < 70) colorClass = "text-yellow-500";
  
  return <span className={`font-mono font-bold ${colorClass}`}>{score}/100</span>;
}

export default function KeywordDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id, 10);

  const { data, isLoading } = useGetKeywordJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetKeywordJobQueryKey(jobId) }
  });

  if (isLoading) {
    return <Layout><div className="animate-pulse h-32 bg-accent rounded-lg" /></Layout>;
  }

  if (!data) {
    return <Layout><div>Job not found.</div></Layout>;
  }

  const { job, keywords } = data;

  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">"{job.seedKeyword}"</h1>
          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
            {job.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {job.city && <span>City: <span className="font-medium text-foreground">{job.city}</span></span>}
          {job.businessCategory && <span>Category: <span className="font-medium text-foreground">{job.businessCategory}</span></span>}
          <span>Keywords Found: <span className="font-mono text-foreground">{job.keywordsFound || 0}</span></span>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">Difficulty</TableHead>
              <TableHead className="text-center">Opp Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords?.map((kw) => (
              <TableRow key={kw.id} className="hover:bg-accent/50 transition-colors">
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {kw.keyword}
                    {kw.isLocalIntent && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Local</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Recommended: {kw.recommendedPageType || '-'}</div>
                </TableCell>
                <TableCell>
                  <IntentBadge intent={kw.searchIntent} />
                </TableCell>
                <TableCell className="text-right font-mono">{kw.volume?.toLocaleString() || '-'}</TableCell>
                <TableCell className="text-right font-mono">${kw.cpc?.toFixed(2) || '-'}</TableCell>
                <TableCell className="text-right font-mono">
                  <span className={
                    (kw.difficulty || 0) > 70 ? 'text-destructive' :
                    (kw.difficulty || 0) > 40 ? 'text-yellow-500' : 'text-emerald-500'
                  }>
                    {kw.difficulty || '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center bg-accent/20">
                  <ScoreBadge score={kw.opportunityScore} />
                </TableCell>
              </TableRow>
            ))}
            {!keywords?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {job.status === 'completed' ? 'No keywords generated.' : 'Generating keywords...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Layout>
  );
}
