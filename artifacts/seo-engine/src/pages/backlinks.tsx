import { Layout } from "@/components/layout";
import { useListBacklinkJobs, getListBacklinkJobsQueryKey, useStartBacklinkDiscovery } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Backlinks() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useListBacklinkJobs({
    query: { queryKey: getListBacklinkJobsQueryKey() }
  });

  const startJob = useStartBacklinkDiscovery();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [niche, setNiche] = useState("");

  const handleStart = () => {
    if (!domain) return;
    startJob.mutate({ data: { domain, niche } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBacklinkJobsQueryKey() });
        setOpen(false);
        setDomain("");
        setNiche("");
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backlink Opportunities</h1>
          <p className="text-muted-foreground mt-1">Discover link building targets for your clients.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Discovery
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Find Backlink Targets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Domain</label>
                <Input 
                  placeholder="e.g. example.com" 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Niche/Industry (Optional)</label>
                <Input 
                  placeholder="e.g. SaaS, Dental, E-commerce" 
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleStart}
                disabled={startJob.isPending || !domain}
              >
                {startJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                Start Discovery
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target Domain</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opportunities</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : jobs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No discovery jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs?.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium font-mono text-sm">{job.domain}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {job.niche || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{job.opportunitiesFound || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(job.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/backlinks/${job.id}`}>View Targets</Link>
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
