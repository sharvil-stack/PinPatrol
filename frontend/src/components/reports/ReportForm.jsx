import { useState } from "react";
import { X } from "lucide-react";

const CATEGORIES = [
  "Theft",
  "Vandalism",
  "Assault",
  "Suspicious Activity",
  "Break-in",
  "Traffic Incident",
  "Other",
];

function ReportForm({ position, onSubmit, onClose }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        lat: position.lat,
        lng: position.lng,
        category,
        severity,
        description: description.trim(),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Report an Incident</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Location: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>

        {error && (
          <p className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-400">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Severity</label>
            <div className="flex gap-2">
              {["LOW", "MEDIUM", "HIGH"].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setSeverity(level)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    severity === level
                      ? "border-orange-500 bg-orange-500/15 text-orange-400"
                      : "border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what happened (10-500 characters)"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            />
          </div>

          <button
            disabled={submitting}
            className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;