import { Layout } from "@/components/layout";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, Search, ShieldAlert, Terminal, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and active operations.</p>
        </div>
        <Button asChild>
          <Link href="/crawls">
            <Terminal className="w-4 h-4 mr-2" />
            Analyze Website
          </Link>
        </Button>
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-accent rounded-lg"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Crawls</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCrawls}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedCrawls} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Issues</CardTitle>
                <ShieldAlert className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.criticalIssues}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {stats.totalIssues} total issues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending To-dos</CardTitle>
                <Clock className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.pendingTodos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Leads</CardTitle>
                <Users className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{stats.qualifiedLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {stats.totalLeads} total leads
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Crawls</h2>
                <Button variant="link" asChild className="text-sm text-primary">
                  <Link href="/crawls">View all</Link>
                </Button>
              </div>
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                {stats.recentCrawls && stats.recentCrawls.length > 0 ? (
                  <div className="divide-y divide-border">
                    {stats.recentCrawls.map(crawl => (
                      <div key={crawl.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                        <div>
                          <Link href={`/crawls/${crawl.id}`} className="font-mono text-sm hover:underline font-medium">
                            {crawl.url}
                          </Link>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-3">
                            <span>{format(new Date(crawl.createdAt), "MMM d, yyyy HH:mm")}</span>
                            <span>•</span>
                            <span>{crawl.pagesProcessed || 0} / {crawl.pagesFound || 0} pages</span>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            crawl.status === 'completed' ? 'default' :
                            crawl.status === 'failed' ? 'destructive' : 'secondary'
                          }
                          className={crawl.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}
                        >
                          {crawl.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Terminal className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No recent crawls found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">System Status</h2>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <Terminal className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span className="text-sm font-medium">Crawler Engine</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <Search className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span className="text-sm font-medium">Keyword Jobs</span>
                    </div>
                    <span className="text-sm font-mono">{stats.totalKeywordJobs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <LinkIcon className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span className="text-sm font-medium">Backlink Jobs</span>
                    </div>
                    <span className="text-sm font-mono">{stats.totalBacklinkJobs}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
