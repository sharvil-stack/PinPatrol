import { useState } from "react";
import { MapPin, Clock, Check, X, FileText, Link2, Loader2 } from "lucide-react";
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  VERIFICATION_COLORS,
  LINK_TYPE_COLORS,
} from "../../utils/reportStyles";

function ReportCard({ report, reportsById, onVerify, onStatusChange, onSummarize, onFindRelated }) {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(report.aiCaseBrief || "");
  const [links, setLinks] = useState(null); // null = not fetched yet
  const [linksLoading, setLinksLoading] = useState(false);

  const runAction = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleSummarize = async () => {
    await runAction(async () => {
      const result = await onSummarize(report.id);
      setSummary(result.summary);
    });
  };

  const handleFindRelated = async () => {
    setLinksLoading(true);
    try {
      const result = await onFindRelated(report.id);
      setLinks(result);
    } finally {
      setLinksLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{report.category}</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                SEVERITY_COLORS[report.severity]?.badge ?? "bg-slate-700 text-slate-300"
              }`}
            >
              {report.severity}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                VERIFICATION_COLORS[report.verificationStatus] ?? ""
              }`}
            >
              {report.verificationStatus}
            </span>
          </div>

          <p className="mt-2 flex items-center gap-1 text-sm text-slate-400">
            <MapPin size={14} />
            {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
          </p>

          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <Clock size={14} />
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>

        <select
          value={report.status}
          disabled={busy}
          onChange={(e) => runAction(() => onStatusChange(report.id, e.target.value))}
          className={`rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium outline-none ${
            STATUS_COLORS[report.status] ?? "text-white"
          }`}
        >
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      <p className="mt-4 text-slate-300">{report.description}</p>

      {summary && (
        <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-orange-200">
          <p className="mb-1 flex items-center gap-1 font-semibold text-orange-400">
            <FileText size={14} /> AI Case Brief
          </p>
          {summary}
        </div>
      )}

      {links !== null && (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1 text-sm font-semibold text-slate-300">
            <Link2 size={14} /> Related Reports
          </p>

          {links.length === 0 && (
            <p className="text-sm text-slate-500">No duplicate or similar reports found.</p>
          )}

          {links.map((link) => {
            const related = reportsById?.[link.relatedReportId];
            return (
              <div
                key={link.id}
                className={`rounded-xl border p-3 text-sm ${LINK_TYPE_COLORS[link.linkType] ?? "border-slate-700 text-slate-300"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
                    {link.linkType}
                  </span>
                  <span className="font-medium text-white">
                    {related ? related.category : `Report #${link.relatedReportId}`}
                  </span>
                  {related && (
                    <span className="text-xs text-slate-400">
                      {new Date(related.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {link.aiReason && <p className="mt-1 text-slate-300">{link.aiReason}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {report.verificationStatus === "PENDING" && (
          <>
            <button
              disabled={busy}
              onClick={() => runAction(() => onVerify(report.id, "VERIFIED"))}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <Check size={16} /> Verify
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => onVerify(report.id, "REJECTED"))}
              className="flex items-center gap-1 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
            >
              <X size={16} /> Reject
            </button>
          </>
        )}

        <button
          disabled={busy}
          onClick={handleSummarize}
          className="flex items-center gap-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <FileText size={16} /> {summary ? "Regenerate Summary" : "Generate AI Summary"}
        </button>

        <button
          disabled={linksLoading}
          onClick={handleFindRelated}
          className="flex items-center gap-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          {linksLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {links !== null ? "Refresh Related" : "Find Related Reports"}
        </button>
      </div>
    </div>
  );
}

export default ReportCard;