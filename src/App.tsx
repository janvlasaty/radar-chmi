import { useState } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import type { RadarProduct } from "./lib/radar";
import { RADAR_BOUNDS } from "./lib/radar";
import { useRadarImages } from "./lib/useRadarImages";
import { TimelinePanel } from "./components/TimelinePanel";

const CZECHIA_CENTER: [number, number] = [49.75, 15.5];
const DEFAULT_ZOOM = 8;

function LocateButton() {
  const map = useMap();

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 11);
      },
      () => {
        // Permission denied or error - ignore
      },
    );
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute top-3 right-3 z-[1000] bg-white rounded-lg shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
      title="Go to my location"
      aria-label="Go to my location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
}

export default function App() {
  const [product, setProduct] = useState<RadarProduct>("maxz");
  const {
    timestamps,
    selectedIndex,
    setSelectedIndex,
    currentImage,
    loading,
  } = useRadarImages(product);

  return (
    <div className="h-screen w-screen relative">
      <MapContainer
        center={CZECHIA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {currentImage && (
          <ImageOverlay
            url={currentImage}
            bounds={RADAR_BOUNDS}
            opacity={0.7}
          />
        )}
        <LocateButton />
      </MapContainer>

      <TimelinePanel
        timestamps={timestamps}
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
        product={product}
        onProductChange={setProduct}
        loading={loading}
      />
    </div>
  );
}
