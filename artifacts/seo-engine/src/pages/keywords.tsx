import { Layout } from "@/components/layout";
import { useListKeywordJobs, getListKeywordJobsQueryKey, useStartKeywordResearch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Keywords() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useListKeywordJobs({
    query: { queryKey: getListKeywordJobsQueryKey() }
  });

  const startJob = useStartKeywordResearch();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const handleStart = () => {
    if (!seed) return;
    startJob.mutate({ data: { seedKeyword: seed, city, businessCategory: category } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKeywordJobsQueryKey() });
        setOpen(false);
        setSeed("");
        setCity("");
        setCategory("");
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keyword Research</h1>
          <p className="text-muted-foreground mt-1">Discover high-value search terms and volume data.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Research
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Keyword Research</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seed Keyword</label>
                <Input 
                  placeholder="e.g. plumber, roofing, dentist" 
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City (Optional)</label>
                  <Input 
                    placeholder="e.g. Chicago" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category (Optional)</label>
                  <Input 
                    placeholder="e.g. Home Services" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleStart}
                disabled={startJob.isPending || !seed}
              >
                {startJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Generate Keywords
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seed Keyword</TableHead>
              <TableHead>Location / Niche</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Keywords Found</TableHead>
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
                  No keyword research jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs?.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.seedKeyword}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {[job.city, job.businessCategory].filter(Boolean).join(" • ") || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{job.keywordsFound || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(job.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/keywords/${job.id}`}>View Keywords</Link>
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
