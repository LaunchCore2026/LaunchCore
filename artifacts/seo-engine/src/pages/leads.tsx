import { Layout } from "@/components/layout";
import { 
  useListLeads, 
  getListLeadsQueryKey, 
  useListLeadJobs, 
  getListLeadJobsQueryKey, 
  useSearchLeads,
  useUpdateLead,
  useGetLead,
  getGetLeadQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Users, Plus, Loader2, MapPin, Globe, Phone, Star, Mail } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, {label: string, className: string}> = {
    new: { label: "New", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    contacted: { label: "Contacted", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    qualified: { label: "Qualified", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    converted: { label: "Converted", className: "bg-primary/10 text-primary border-primary/20" },
    disqualified: { label: "Disqualified", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const config = map[status] || { label: status, className: "" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function Leads() {
  const queryClient = useQueryClient();
  
  const { data: leads, isLoading: leadsLoading } = useListLeads({
    query: { queryKey: getListLeadsQueryKey() }
  });

  const { data: jobs, isLoading: jobsLoading } = useListLeadJobs({
    query: { queryKey: getListLeadJobsQueryKey() }
  });

  const searchLeads = useSearchLeads();
  const updateLead = useUpdateLead();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const { data: selectedLeadData, isLoading: leadLoading } = useGetLead(selectedLeadId as number, {
    query: { enabled: !!selectedLeadId, queryKey: getGetLeadQueryKey(selectedLeadId as number) }
  });

  const [leadStatus, setLeadStatus] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  useEffect(() => {
    if (selectedLeadData) {
      setLeadStatus(selectedLeadData.status);
      setLeadNotes(selectedLeadData.notes || "");
      setLeadEmail(selectedLeadData.email || "");
    }
  }, [selectedLeadData]);

  const handleStartSearch = () => {
    if (!category || !city) return;
    searchLeads.mutate({ data: { businessCategory: category, city } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadJobsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        setOpen(false);
        setCategory("");
        setCity("");
      }
    });
  };

  const handleOpenLead = (id: number) => {
    setSelectedLeadId(id);
  };

  const handleSaveLead = () => {
    if (!selectedLeadId) return;
    updateLead.mutate({ id: selectedLeadId, data: { status: leadStatus as any, notes: leadNotes, email: leadEmail } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(selectedLeadId) });
        setSelectedLeadId(null);
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Generation</h1>
          <p className="text-muted-foreground mt-1">Find and qualify local businesses for SEO services.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Find Leads
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search Local Businesses</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Category / Niche</label>
                <Input 
                  placeholder="e.g. Plumber, Dentist, Law Firm" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target City</label>
                <Input 
                  placeholder="e.g. Austin, TX" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleStartSearch}
                disabled={searchLeads.isPending || !category || !city}
              >
                {searchLeads.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Start Search
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="jobs">Search Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <div className="border border-border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : leads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leads found. Start a search to populate your CRM.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads?.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium text-primary">{lead.businessName}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {lead.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.city}</span>}
                          {lead.rating && <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-current" /> {lead.rating}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        <div className={`font-mono font-bold ${
                          (lead.leadScore || 0) >= 80 ? 'text-emerald-500' :
                          (lead.leadScore || 0) >= 50 ? 'text-yellow-500' : 'text-muted-foreground'
                        }`}>
                          {lead.leadScore || 0}/100
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {lead.website ? (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          ) : <span className="text-muted-foreground text-xs">No website</span>}
                          {lead.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" /> {lead.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenLead(lead.id)}>Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="border border-border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Parameters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads Found</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : jobs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs?.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.businessCategory} in {job.city}
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{job.leadsFound || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(job.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedLeadId} onOpenChange={(val) => !val && setSelectedLeadId(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] border-border bg-card">
          <SheetHeader>
            <SheetTitle>{selectedLeadData?.businessName || "Loading..."}</SheetTitle>
            <SheetDescription>
              {selectedLeadData?.category} {selectedLeadData?.category && selectedLeadData?.city ? '•' : ''} {selectedLeadData?.city}
            </SheetDescription>
          </SheetHeader>
          
          {leadLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                 <h4 className="text-sm font-medium border-b border-border pb-2">Contact Info</h4>
                 <div className="grid gap-3">
                   {selectedLeadData?.website && (
                     <a href={selectedLeadData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:underline text-primary">
                       <Globe className="w-4 h-4 text-muted-foreground" /> {selectedLeadData.website}
                     </a>
                   )}
                   {selectedLeadData?.phone && (
                     <div className="flex items-center gap-3 text-sm">
                       <Phone className="w-4 h-4 text-muted-foreground" /> {selectedLeadData.phone}
                     </div>
                   )}
                   {selectedLeadData?.address && (
                     <div className="flex items-center gap-3 text-sm">
                       <MapPin className="w-4 h-4 text-muted-foreground" /> {selectedLeadData.address}
                     </div>
                   )}
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-sm font-medium border-b border-border pb-2">Lead Management</h4>
                 <div className="space-y-3">
                   <div className="space-y-2">
                     <Label>Status</Label>
                     <Select value={leadStatus} onValueChange={setLeadStatus}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="new">New</SelectItem>
                         <SelectItem value="contacted">Contacted</SelectItem>
                         <SelectItem value="qualified">Qualified</SelectItem>
                         <SelectItem value="converted">Converted</SelectItem>
                         <SelectItem value="disqualified">Disqualified</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Email</Label>
                     <Input 
                       type="email" 
                       placeholder="Contact email" 
                       value={leadEmail}
                       onChange={(e) => setLeadEmail(e.target.value)}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Notes</Label>
                     <Textarea 
                       placeholder="Add notes about this lead..." 
                       className="min-h-[120px]"
                       value={leadNotes}
                       onChange={(e) => setLeadNotes(e.target.value)}
                     />
                   </div>
                 </div>
              </div>
            </div>
          )}
          <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-card border-t border-border">
            <Button onClick={handleSaveLead} disabled={updateLead.isPending || leadLoading} className="w-full">
              {updateLead.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
