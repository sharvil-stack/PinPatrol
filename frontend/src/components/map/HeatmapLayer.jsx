import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const SEVERITY_WEIGHT = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 1.0,
};

/**
 * Renders a density heatmap of the given reports on the current map instance.
 * Not a JSX-visible component - leaflet.heat draws directly onto the map's
 * canvas, so this just manages the imperative layer's lifecycle.
 */
function HeatmapLayer({ reports }) {
  const map = useMap();

  useEffect(() => {
    const points = reports.map((r) => [
      r.lat,
      r.lng,
      SEVERITY_WEIGHT[r.severity] ?? 0.5,
    ]);

    const heatLayer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      gradient: {
        0.2: "#22c55e",
        0.4: "#eab308",
        0.7: "#f97316",
        1.0: "#ef4444",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, reports]);

  return null;
}

export default HeatmapLayer;