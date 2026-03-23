import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Search, 
  RefreshCcw, 
  ExternalLink, 
  Trash2, 
  Users, 
  Sparkles, 
  Calendar,
  Inbox,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageCircle
} from "lucide-react";
import { useLeadsData, useRemoveLead } from "@/hooks/use-leads-data";
import { ConfirmDialog } from "@/components/confirm-dialog";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
        copied
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
      }`}
      title="Copy connection request to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" /> Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" /> Copy Message
        </>
      )}
    </button>
  );
}

function extractProfileId(profileUrl: string): string {
  // Handles: https://linkedin.com/in/username or https://linkedin.com/in/username/
  const match = profileUrl.replace(/\/$/, "").match(/\/in\/([^/?#]+)/);
  return match ? match[1] : "";
}

function LinkedInMessageButton({ profileUrl, aiDraft }: { profileUrl: string; aiDraft?: string | null }) {
  const profileId = extractProfileId(profileUrl);
  if (!profileId) return null;
  const params = new URLSearchParams({ recipient: profileId });
  if (aiDraft) params.set("body", aiDraft);
  const href = `https://www.linkedin.com/messaging/thread/new/?${params.toString()}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5]/20 transition-all duration-200 whitespace-nowrap"
      title="Message on LinkedIn"
    >
      <MessageCircle className="w-3 h-3" />
      Message
    </a>
  );
}

function LeadRow({ lead, index, onDelete }: { lead: any; index: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        key={lead.id}
        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => lead.ai_draft && setExpanded(v => !v)}
      >
        {/* Prospect */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-900/60 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-zinc-100 leading-tight">{lead.name}</p>
              <a
                href={lead.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 transition-colors w-fit"
              >
                View Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </td>

        {/* Title */}
        <td className="px-6 py-4">
          <span className="text-zinc-300 text-sm block max-w-[220px] truncate">
            {lead.title || <span className="text-zinc-600 italic">No title</span>}
          </span>
        </td>

        {/* Date */}
        <td className="px-6 py-4 text-zinc-400 text-sm whitespace-nowrap">
          {format(new Date(lead.created_at), "MMM d, yyyy")}
        </td>

        {/* AI Draft Preview */}
        <td className="px-6 py-4 max-w-xs">
          {lead.ai_draft ? (
            <div className="flex items-start gap-2">
              <p className="text-zinc-300 text-sm line-clamp-2 flex-1 leading-snug">
                {lead.ai_draft}
              </p>
              {lead.ai_draft && (
                <button
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          ) : (
            <span className="text-zinc-600 text-xs italic">No draft generated</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <LinkedInMessageButton profileUrl={lead.profile_url} aiDraft={lead.ai_draft} />
            {lead.ai_draft && <CopyButton text={lead.ai_draft} />}
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>

      {/* Expanded AI Draft */}
      <AnimatePresence>
        {expanded && lead.ai_draft && (
          <tr>
            <td colSpan={5} className="px-6 pb-4">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Connection Request</span>
                        <span className="text-xs text-zinc-500">{lead.ai_draft.length} chars</span>
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed font-medium">
                        "{lead.ai_draft}"
                      </p>
                    </div>
                    <CopyButton text={lead.ai_draft} />
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Dashboard() {
  const { data: leads = [], isLoading, isError, refetch, isFetching } = useLeadsData();
  const { mutate: removeLead, isPending: isDeleting } = useRemoveLead();

  const [searchQuery, setSearchQuery] = useState("");
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(query) ||
      (lead.title && lead.title.toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

  const stats = useMemo(() => {
    const aiDrafts = leads.filter(l => l.ai_draft).length;
    const thisWeek = leads.filter(l => {
      const d = new Date(l.created_at);
      const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: leads.length, aiDrafts, thisWeek };
  }, [leads]);

  const handleDelete = () => {
    if (leadToDelete !== null) {
      removeLead({ id: leadToDelete }, {
        onSettled: () => setLeadToDelete(null)
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-3"
          >
            <Sparkles className="w-3 h-3" />
            Lead Capture CRM
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient pb-1">Signals Captured</h1>
          <p className="text-zinc-400 mt-2 text-lg">Manage and review your saved LinkedIn prospects.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full md:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 group"
          >
            <RefreshCcw className={`w-5 h-5 ${isFetching ? "animate-spin text-primary" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {[
          { label: "Total Leads", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "AI Drafts Generated", value: stats.aiDrafts, icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Saved This Week", value: stats.thisWeek, icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10" }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
              <stat.icon className={`w-12 h-12 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-zinc-400 font-medium">{stat.label}</p>
              <p className="text-4xl font-bold text-white mt-1">{isLoading ? "–" : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            Recent Prospects
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium text-zinc-300">
              {filteredLeads.length}
            </span>
          </h2>
          {stats.aiDrafts > 0 && (
            <span className="text-xs text-zinc-500">Click a row to expand the AI draft</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p>Loading your leads...</p>
          </div>
        ) : isError ? (
          <div className="p-12 flex flex-col items-center justify-center text-red-400 space-y-4">
            <AlertTriangle className="w-10 h-10 opacity-80" />
            <p>Failed to load leads. Please try again.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Inbox className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No leads found</h3>
            <p className="text-zinc-400 max-w-md">
              {searchQuery
                ? `No results matching "${searchQuery}". Try a different term.`
                : "You haven't saved any leads yet. Use the Chrome Extension on a LinkedIn profile to capture your first prospect."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-6 py-3.5">Prospect</th>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Saved</th>
                  <th className="px-6 py-3.5">AI Draft</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLeads.map((lead, i) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    index={i}
                    onDelete={() => setLeadToDelete(lead.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={leadToDelete !== null}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Prospect"
        description="Are you sure you want to remove this lead? This action cannot be undone and any associated AI drafts will be lost."
        confirmText="Delete Lead"
        isPending={isDeleting}
      />

    </div>
  );
}
