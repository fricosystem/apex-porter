// @ts-nocheck - Disable all TypeScript checks for this file to avoid react-leaflet type issues
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
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
    status?: 'ok' | 'irregularidade' | 'pending';
  }>;
  isSatellite?: boolean;
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
      const bounds = pontos.map(p => [p.latitude, p.longitude]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 20 });
    }
  }, [pontos, map]);

  return null;
}

function MarkerWithTooltip({ ponto }: { ponto: { nome: string; latitude: number; longitude: number; status?: 'ok' | 'irregularidade' | 'pending' } }) {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    // Hide tooltip after 3 seconds
    const timeout = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [ponto]);

  const handleClick = () => {
    // Show tooltip when clicked and hide after 3 seconds
    setShowTooltip(true);
    const timeout = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
    return () => clearTimeout(timeout);
  };

  // Custom marker colors
  const getMarkerColor = () => {
    switch (ponto.status) {
      case 'ok':
      case 'ok':
        return '#10b981'; // emerald-500
      case 'irregularidade':
        return '#ef4444'; // red-500
      case 'pending':
      default:
        return '#6b7280'; // gray-500
    }
  };

  const markerColor = getMarkerColor();
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">•</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return (
    <Marker
      position={[ponto.latitude, ponto.longitude]}
      icon={customIcon}
      eventHandlers={{ click: handleClick }}
    >
      {showTooltip && (
        <Tooltip
          permanent={true}
          direction="top"
          offset={[0, -30]}
          opacity={1}
        >
          <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
            {ponto.nome}
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}

export default function RotaMap({ pontos, isSatellite = false }: RotaMapProps) {
  if (pontos.length === 0) return null;

  const bounds = pontos.map(p => [p.latitude, p.longitude]);
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
          url={isSatellite 
            ? "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" 
            : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          }
          maxZoom={22}
        />
        <FixMapSize />
        <FitBounds pontos={pontos} />
        <Polyline positions={polylinePositions} color="#059669" weight={4} />
        {pontos.map((ponto, idx) => (
          <MarkerWithTooltip key={idx} ponto={ponto} />
        ))}
      </MapContainer>
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip:before {
          border-top-color: #111827 !important;
        }
      `}</style>
    </div>
  );
}
