import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const AddressMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(30.75231);
  const [lat] = useState(28.10935);
  const [zoom] = useState(11);

  useEffect(() => {
    if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
      maplibregl.setRTLTextPlugin(
        "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
        true,
      );
    }
    if (map.current || !mapContainer.current) return; // initialize map only once
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // You can replace this with your own map style
      style:
        "https://api.maptiler.com/maps/streets/style.json?key=nX9wkFD9ZupSofktAvOL",
      center: [lng, lat],
      zoom: zoom,
    });

    new maplibregl.Marker().setLngLat([lng, lat]).addTo(map.current);
  });

  return (
    <div className="map-container">
      <div
        ref={mapContainer}
        className="map"
        style={{ height: "400px", width: "100%" }}
      />
    </div>
  );
};

export default AddressMap;
