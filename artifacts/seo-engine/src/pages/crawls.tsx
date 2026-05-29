import { Layout } from "@/components/layout";
import { useListCrawls, getListCrawlsQueryKey, useStartCrawl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { Terminal, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Crawls() {
  const queryClient = useQueryClient();
  const { data: crawls, isLoading } = useListCrawls({
    query: { queryKey: getListCrawlsQueryKey() }
  });

  const startCrawl = useStartCrawl();
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleStart = () => {
    if (!url) return;
    startCrawl.mutate({ data: { url } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCrawlsQueryKey() });
        setOpen(false);
        setUrl("");
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Crawls</h1>
          <p className="text-muted-foreground mt-1">Analyze websites for technical SEO issues.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Crawl
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Analyze a Website</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website URL</label>
                <Input 
                  placeholder="https://example.com" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleStart}
                disabled={startCrawl.isPending || !url}
              >
                {startCrawl.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Terminal className="w-4 h-4 mr-2" />}
                Start Analysis
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pages Found</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : crawls?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No crawls found. Start an analysis to see data here.
                </TableCell>
              </TableRow>
            ) : (
              crawls?.map(crawl => (
                <TableRow key={crawl.id}>
                  <TableCell className="font-medium font-mono text-sm">{crawl.url}</TableCell>
                  <TableCell>
                    <Badge variant={crawl.status === 'completed' ? 'default' : 'secondary'} className={crawl.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                      {crawl.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{crawl.pagesFound || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(crawl.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/crawls/${crawl.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
