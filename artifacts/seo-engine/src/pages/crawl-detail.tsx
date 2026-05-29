import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { 
  useGetCrawl, 
  getGetCrawlQueryKey, 
  useGetCrawlSummary, 
  getGetCrawlSummaryQueryKey,
  useGetCrawlPages,
  getGetCrawlPagesQueryKey,
  useGetCrawlIssues,
  getGetCrawlIssuesQueryKey,
  useGetCrawlTodos,
  getGetCrawlTodosQueryKey,
  useGetCrawlReport,
  getGetCrawlReportQueryKey,
  useUpdateTodo
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info, CheckCircle, ShieldAlert, Loader2, Link as LinkIcon, FileText, BarChart, ExternalLink, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed' || status === 'implemented' || status === 'validated') {
    return <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">{status}</Badge>;
  }
  if (status === 'failed' || status === 'disqualified') {
    return <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">{status}</Badge>;
  }
  if (status === 'running' || status === 'in_progress') {
    return <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'critical') return <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">Critical</Badge>;
  if (severity === 'high') return <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/10">High</Badge>;
  if (severity === 'medium') return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">Medium</Badge>;
  if (severity === 'low') return <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Low</Badge>;
  return <Badge variant="secondary">{severity}</Badge>;
}

export default function CrawlDetail() {
  const { id } = useParams<{ id: string }>();
  const crawlId = parseInt(id, 10);
  const queryClient = useQueryClient();

  const { data: crawl, isLoading: crawlLoading } = useGetCrawl(crawlId, {
    query: { enabled: !!crawlId, queryKey: getGetCrawlQueryKey(crawlId) }
  });

  const isCompleted = crawl?.status === 'completed';

  const { data: summary, isLoading: summaryLoading } = useGetCrawlSummary(crawlId, {
    query: { enabled: !!crawlId && isCompleted, queryKey: getGetCrawlSummaryQueryKey(crawlId) }
  });

  const { data: pages } = useGetCrawlPages(crawlId, {
    query: { enabled: !!crawlId && isCompleted, queryKey: getGetCrawlPagesQueryKey(crawlId) }
  });

  const { data: issues } = useGetCrawlIssues(crawlId, {
    query: { enabled: !!crawlId && isCompleted, queryKey: getGetCrawlIssuesQueryKey(crawlId) }
  });

  const { data: todos } = useGetCrawlTodos(crawlId, {
    query: { enabled: !!crawlId && isCompleted, queryKey: getGetCrawlTodosQueryKey(crawlId) }
  });

  const { data: report } = useGetCrawlReport(crawlId, {
    query: { enabled: !!crawlId && isCompleted, queryKey: getGetCrawlReportQueryKey(crawlId) }
  });

  const updateTodo = useUpdateTodo();

  const handleUpdateTodoStatus = (todoId: number, status: any) => {
    updateTodo.mutate({ id: todoId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCrawlTodosQueryKey(crawlId) });
      }
    });
  };

  if (crawlLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-accent rounded-lg w-1/3"></div>
          <div className="h-8 bg-accent rounded-lg w-1/4"></div>
          <div className="h-64 bg-accent rounded-lg w-full"></div>
        </div>
      </Layout>
    );
  }

  if (!crawl) {
    return <Layout><div className="p-8 text-center text-muted-foreground border border-border rounded-lg">Crawl not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight font-mono truncate max-w-[600px]">{crawl.url}</h1>
            <StatusBadge status={crawl.status} />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-4">
            <span>Pages: {crawl.pagesProcessed || 0} / {crawl.pagesFound || 0}</span>
            {crawl.errorMessage && <span className="text-destructive text-sm">{crawl.errorMessage}</span>}
          </p>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="pages" disabled={!isCompleted}>Pages</TabsTrigger>
          <TabsTrigger value="issues" disabled={!isCompleted}>Issues</TabsTrigger>
          <TabsTrigger value="todos" disabled={!isCompleted}>To-dos</TabsTrigger>
          <TabsTrigger value="report" disabled={!isCompleted}>Report</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {!summary ? (
             <div className="p-12 text-center border border-border rounded-lg bg-card/50 flex flex-col items-center justify-center">
               {crawl.status === 'running' || crawl.status === 'pending' ? (
                 <>
                   <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                   <h3 className="text-lg font-medium">Analysis in progress</h3>
                   <p className="text-muted-foreground mt-1">Crawling {crawl.url}...</p>
                 </>
               ) : (
                 <p className="text-muted-foreground">No summary available.</p>
               )}
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-destructive" /> Critical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">{summary.issueCounts.critical}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> High Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-500">{summary.issueCounts.high}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Info className="w-4 h-4 text-yellow-500" /> Medium Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-500">{summary.issueCounts.medium}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Low Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-500">{summary.issueCounts.low}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Issues</CardTitle>
                    <CardDescription>Highest priority items affecting SEO performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summary.topIssues.length > 0 ? (
                      <div className="space-y-4">
                        {summary.topIssues.map((issue) => (
                          <div key={issue.id} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <SeverityBadge severity={issue.severity} />
                                <span className="font-medium">{issue.issueType}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{issue.affectedUrl}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No critical or high issues found.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>To-do Priorities</CardTitle>
                    <CardDescription>Action plan breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">P1 (Critical)</Badge>
                        <span className="font-mono">{summary.todoCounts.p1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">P2 (High)</Badge>
                        <span className="font-mono">{summary.todoCounts.p2}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">P3 (Medium)</Badge>
                        <span className="font-mono">{summary.todoCounts.p3}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">P4 (Low)</Badge>
                        <span className="font-mono">{summary.todoCounts.p4}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Word Count</TableHead>
                  <TableHead>Links (In/Out)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages?.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="max-w-[300px] truncate font-mono text-sm" title={page.url}>
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-primary">
                        {new URL(page.url).pathname} <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        page.statusCode === 200 ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                        page.statusCode === 404 ? 'border-destructive/30 text-destructive bg-destructive/10' : ''
                      }>
                        {page.statusCode || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{page.title || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{page.wordCount || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {page.internalLinksCount || 0} / {page.externalLinksCount || 0}
                    </TableCell>
                  </TableRow>
                ))}
                {!pages?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pages found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues?.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell><SeverityBadge severity={issue.severity} /></TableCell>
                    <TableCell className="font-medium text-sm">{issue.issueType}</TableCell>
                    <TableCell className="max-w-[300px] truncate font-mono text-xs text-muted-foreground" title={issue.affectedUrl}>
                      {issue.affectedUrl}
                    </TableCell>
                    <TableCell className="text-sm">{issue.category}</TableCell>
                  </TableRow>
                ))}
                {!issues?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No issues found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="todos">
          <div className="grid gap-4">
            {todos?.map((todo) => (
              <Card key={todo.id}>
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">{todo.priority}</Badge>
                      <Badge variant="secondary" className="bg-accent">{todo.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{todo.title}</CardTitle>
                    <CardDescription className="mt-1">{todo.description}</CardDescription>
                  </div>
                  <Select 
                    defaultValue={todo.status} 
                    onValueChange={(val) => handleUpdateTodoStatus(todo.id, val)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="implemented">Implemented</SelectItem>
                      <SelectItem value="validated">Validated</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-accent/50 rounded-lg">
                    <div>
                      <span className="text-muted-foreground font-medium mb-1 block">Why it matters:</span>
                      <p>{todo.whyItMatters || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium mb-1 block">Exact Action:</span>
                      <p className="font-mono text-xs">{todo.exactAction || '-'}</p>
                    </div>
                  </div>
                  {todo.targetUrl && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <LinkIcon className="w-3 h-3" />
                      <a href={todo.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-full">
                        {todo.targetUrl}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!todos?.length && (
               <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
                 No todos generated for this crawl.
               </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="report">
          {report ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.executiveSummary || 'Not available'}</p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Biggest Revenue Leaks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.biggestRevenueLeaks || 'Not available'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Wins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.quickWins || 'Not available'}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Action Plan (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.actionPlan30Days || 'Not available'}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
              Report is not available yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
