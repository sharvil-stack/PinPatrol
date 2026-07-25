import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMapEvents } from "react-leaflet";
import { Crosshair, X, Flame, MapPin as MapPinIcon, Radar } from "lucide-react";
import Navbar from "../components/common/Navbar";
import ReportForm from "../components/reports/ReportForm";
import HeatmapLayer from "../components/map/HeatmapLayer";
import { listReports, createReport, getNearbyReports } from "../services/reportService";
import { subscribeToReports } from "../services/socket";
import { severityDotColor } from "../utils/reportStyles";

const DEFAULT_CENTER = [18.5204, 73.8567]; 
const NEARBY_RADIUS_KM = 1;

function ClickCatcher({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function LiveMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [viewMode, setViewMode] = useState("pins"); 

  
  const [nearbyCenter, setNearbyCenter] = useState(null);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    listReports()
      .then(setReports)
      .catch(() => setError("Could not load reports from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToReports((incoming) => {
      setReports((prev) => {
        if (prev.some((r) => r.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!nearbyCenter) return;

    let cancelled = false;
    setNearbyLoading(true);

    getNearbyReports(nearbyCenter.lat, nearbyCenter.lng, NEARBY_RADIUS_KM)
      .then((results) => {
        if (!cancelled) setNearbyResults(results);
      })
      .catch(() => {
        if (!cancelled) setNearbyResults([]);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nearbyCenter]);

  const handleMapClick = useCallback(
    (latlng) => {
      if (placing) {
        setPendingPosition({ lat: latlng.lat, lng: latlng.lng });
        setPlacing(false);
      } else {
        setNearbyCenter({ lat: latlng.lat, lng: latlng.lng });
      }
    },
    [placing]
  );

  const handleSubmit = async (payload) => {
    const created = await createReport(payload);
    setReports((prev) => [created, ...prev]);
    return created;
  };

  return (
    <div className="flex h-screen flex-col bg-[#0B1220]">
      <Navbar />

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#0B1220]/70 text-slate-300">
            Loading reports...
          </div>
        )}

        {error && (
          <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-lg bg-red-500/90 px-4 py-2 text-sm text-white shadow-lg">
            {error}
          </div>
        )}

        <div className="absolute right-4 top-4 z-[500] flex gap-3">
          <div className="flex rounded-xl bg-slate-900/95 p-1 shadow-lg">
            <button
              onClick={() => setViewMode("pins")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "pins"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapPinIcon size={16} /> Pins
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "heatmap"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame size={16} /> Heatmap
            </button>
          </div>

          <button
            onClick={() => setPlacing((p) => !p)}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold shadow-lg transition ${
              placing
                ? "bg-slate-800 text-orange-400"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {placing ? <X size={18} /> : <Crosshair size={18} />}
            {placing ? "Cancel" : "Report an Incident"}
          </button>
        </div>

        {placing && (
          <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-lg bg-slate-900/95 px-4 py-2 text-sm text-slate-300 shadow-lg">
            Click anywhere on the map to drop a pin
          </div>
        )}

        {!placing && !nearbyCenter && (
          <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-lg bg-slate-900/95 px-4 py-2 text-sm text-slate-400 shadow-lg">
            Click anywhere to see incidents within {NEARBY_RADIUS_KM}km
          </div>
        )}

        {nearbyCenter && (
          <div className="absolute bottom-6 left-1/2 z-[500] w-full max-w-md -translate-x-1/2 px-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Radar size={16} className="text-orange-500" />
                  Within {NEARBY_RADIUS_KM}km
                </p>
                <button
                  onClick={() => {
                    setNearbyCenter(null);
                    setNearbyResults([]);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {nearbyLoading && (
                <p className="text-sm text-slate-400">Searching nearby reports...</p>
              )}

              {!nearbyLoading && nearbyResults.length === 0 && (
                <p className="text-sm text-slate-500">No reports found in this area.</p>
              )}

              {!nearbyLoading && nearbyResults.length > 0 && (
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {nearbyResults.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{report.category}</span>
                        <span
                          className="text-xs font-semibold uppercase"
                          style={{ color: severityDotColor(report.severity) }}
                        >
                          {report.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400">{report.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickCatcher onClick={handleMapClick} />

          {nearbyCenter && (
            <Circle
              center={[nearbyCenter.lat, nearbyCenter.lng]}
              radius={NEARBY_RADIUS_KM * 1000}
              pathOptions={{
                color: "#f97316",
                fillColor: "#f97316",
                fillOpacity: 0.08,
                weight: 2,
                dashArray: "6 6",
              }}
            />
          )}

          {viewMode === "heatmap" ? (
            <HeatmapLayer reports={reports} />
          ) : (
            reports.map((report) => (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                radius={9}
                pathOptions={{
                  color: severityDotColor(report.severity),
                  fillColor: severityDotColor(report.severity),
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold">{report.category}</p>
                    <p>Severity: {report.severity}</p>
                    <p>Status: {report.status}</p>
                    <p>Verification: {report.verificationStatus}</p>
                    <p className="max-w-[220px] text-slate-600">{report.description}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          )}
        </MapContainer>
      </div>

      {pendingPosition && (
        <ReportForm
          position={pendingPosition}
          onSubmit={handleSubmit}
          onClose={() => setPendingPosition(null)}
        />
      )}
    </div>
  );
}

export default LiveMap;