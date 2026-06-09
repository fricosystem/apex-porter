'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue in Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MiniMapProps {
  latitude: number;
  longitude: number;
  raio: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 18);
  }, [lat, lng, map]);
  return null;
}

export default function MiniMap({ latitude, longitude, raio, onLocationSelect }: MiniMapProps) {
  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
        <Circle center={[latitude, longitude]} radius={raio} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }} />
        <MapUpdater lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
}
