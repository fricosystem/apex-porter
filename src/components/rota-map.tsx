'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue in Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RotaMapProps {
  pontos: Array<{
    latitude: number;
    longitude: number;
    nome: string;
  }>;
}

function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to fix tile loading issues in modals
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
    setTimeout(() => {
      map.invalidateSize();
    }, 600);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

function FitBounds({ pontos }: { pontos: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap();

  useEffect(() => {
    if (pontos.length > 0) {
      const bounds = pontos.map(p => [p.latitude, p.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [pontos, map]);

  return null;
}

export default function RotaMap({ pontos }: RotaMapProps) {
  if (pontos.length === 0) return null;

  const bounds = pontos.map(p => [p.latitude, p.longitude] as [number, number]);
  const center = bounds[0];
  const polylinePositions = bounds;

  // Force re-render with key based on pontos
  const mapKey = pontos.map(p => `${p.latitude}-${p.longitude}`).join('|');

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution=""
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={22}
        />
        <FixMapSize />
        <FitBounds pontos={pontos} />
        <Polyline positions={polylinePositions} color="#059669" weight={4} />
        {pontos.map((ponto, idx) => (
          <Marker key={idx} position={[ponto.latitude, ponto.longitude]} />
        ))}
      </MapContainer>
    </div>
  );
}
