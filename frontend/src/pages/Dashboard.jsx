import { useEffect, useState, useMemo } from "react";
import { FolderOpen, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import Navbar from "../components/common/Navbar";
import StatCard from "../components/dashboard/StatCard";
import ReportCard from "../components/reports/ReportCard";
import { getStats } from "../services/dashboardService";
import {
  listReports,
  verifyReport,
  updateStatus,
  getCaseSummary,
  getRelatedReports,
} from "../services/reportService";

const FILTERS = ["PENDING", "ALL"];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, reportsData] = await Promise.all([getStats(), listReports()]);
      setStats(statsData);
      setReports(reportsData);
    } catch {
      setError("Could not load dashboard data from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const visibleReports = useMemo(() => {
    if (filter === "PENDING") {
      return reports.filter((r) => r.verificationStatus === "PENDING");
    }
    return reports;
  }, [reports, filter]);

  // Lets ReportCard resolve a related report's category/date from just its ID,
  // without an extra fetch per link.
  const reportsById = useMemo(() => {
    return Object.fromEntries(reports.map((r) => [r.id, r]));
  }, [reports]);

  const patchReport = (id, patch) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleVerify = async (id, verificationStatus) => {
    const updated = await verifyReport(id, verificationStatus);
    patchReport(id, updated);
  };

  const handleStatusChange = async (id, status) => {
    const updated = await updateStatus(id, status);
    patchReport(id, updated);
  };

  const handleSummarize = async (id) => {
    const result = await getCaseSummary(id);
    patchReport(id, { aiCaseBrief: result.summary });
    return result;
  };

  const handleFindRelated = async (id) => {
    return getRelatedReports(id);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-10">
        <h1 className="text-3xl font-bold">Officer Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Review incoming reports, verify incidents, and track investigation status.
        </p>

        {error && (
          <p className="mt-6 rounded bg-red-500/20 p-3 text-red-400">{error}</p>
        )}

        {stats && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FolderOpen} label="Open" value={stats.open} accent="text-orange-500" />
            <StatCard
              icon={Activity}
              label="Investigating"
              value={stats.investigating}
              accent="text-blue-400"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={stats.resolved}
              accent="text-emerald-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="High Severity"
              value={stats.highSeverity}
              accent="text-red-400"
            />
          </div>
        )}

        {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Reports by Category</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-300"
                >
                  {category}: <span className="font-semibold text-white">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Reports</h2>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? "bg-orange-500 text-white"
                    : "border border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {f === "PENDING" ? "Pending Verification" : "All Reports"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {loading && <p className="text-slate-400">Loading reports...</p>}

          {!loading && visibleReports.length === 0 && (
            <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No reports to show here.
            </p>
          )}

          {visibleReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              reportsById={reportsById}
              onVerify={handleVerify}
              onStatusChange={handleStatusChange}
              onSummarize={handleSummarize}
              onFindRelated={handleFindRelated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;