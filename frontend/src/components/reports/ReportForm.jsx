import { useState } from "react";
import { X, Paperclip, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { uploadReportMedia, mediaTypeFromFile } from "../../services/mediaService";

const CATEGORIES = [
  "Theft",
  "Vandalism",
  "Assault",
  "Suspicious Activity",
  "Break-in",
  "Traffic Incident",
  "Other",
];

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 25;

function ReportForm({ position, onSubmit, onClose }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // progress text during media phase

  const handleFilesChosen = (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file if removed and re-added

    const valid = [];
    for (const file of chosen) {
      if (files.length + valid.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      if (!mediaTypeFromFile(file)) {
        setError(`${file.name} isn't an image, video, or audio file.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} is over ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length) setError("");
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await onSubmit({
        lat: position.lat,
        lng: position.lng,
        category,
        severity,
        description: description.trim(),
      });

      if (files.length > 0 && created?.id) {
        let failures = 0;
        for (let i = 0; i < files.length; i++) {
          setUploadStatus(`Uploading media ${i + 1} of ${files.length}...`);
          try {
            await uploadReportMedia(created.id, files[i]);
          } catch {
            failures++;
          }
        }
        setUploadStatus(
          failures > 0
            ? `Report submitted. ${failures} of ${files.length} file(s) failed to upload.`
            : "Report and media submitted."
        );
        // Give the person a moment to see the outcome before the modal closes.
        setTimeout(onClose, failures > 0 ? 2200 : 900);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
      setSubmitting(false);
    }
  };

  const busy = submitting;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Report an Incident</h2>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-white disabled:opacity-40">
            <X size={22} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Location: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>

        {error && (
          <p className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-400">{error}</p>
        )}

        {uploadStatus && (
          <p className="mb-4 flex items-center gap-2 rounded bg-orange-500/15 p-3 text-sm text-orange-300">
            {uploadStatus.startsWith("Report submitted.") ? (
              <AlertTriangle size={16} />
            ) : uploadStatus.startsWith("Uploading") ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {uploadStatus}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500 disabled:opacity-50"
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
                  disabled={busy}
                  onClick={() => setSeverity(level)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
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
              disabled={busy}
              placeholder="Describe what happened (10-500 characters)"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Photos / Video / Audio <span className="text-slate-600">(optional, up to {MAX_FILES})</span>
            </label>

            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400 transition hover:border-orange-500 hover:text-orange-400 ${
                busy ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <Paperclip size={18} />
              Attach evidence
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={handleFilesChosen}
                disabled={busy}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={busy}
                      className="ml-2 shrink-0 text-slate-500 hover:text-red-400 disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            disabled={busy}
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