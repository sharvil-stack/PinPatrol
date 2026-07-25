export const SEVERITY_COLORS = {
  LOW: { badge: "bg-emerald-500/15 text-emerald-400", dot: "#10b981" },
  MEDIUM: { badge: "bg-amber-500/15 text-amber-400", dot: "#f59e0b" },
  HIGH: { badge: "bg-red-500/15 text-red-400", dot: "#ef4444" },
};

export const STATUS_COLORS = {
  OPEN: "text-red-400",
  IN_PROGRESS: "text-amber-400",
  RESOLVED: "text-emerald-400",
};

export const VERIFICATION_COLORS = {
  PENDING: "bg-amber-500/15 text-amber-400",
  VERIFIED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

export const LINK_TYPE_COLORS = {
  DUPLICATE: "bg-red-500/15 text-red-400 border-red-500/30",
  SIMILAR: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export const severityDotColor = (severity) =>
  SEVERITY_COLORS[severity?.toUpperCase()]?.dot || "#6b7280";