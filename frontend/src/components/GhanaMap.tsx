'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GHANA_CENTER, REGION_COORDINATES } from '@/lib/constants';
import type { RegionalSummary } from '@/lib/api';

// Ghana's geographic bounding box (SW corner to NE corner)
const GHANA_BOUNDS: L.LatLngBoundsExpression = [
  [4.7, -3.3],   // Southwest
  [11.2, 1.2],   // Northeast
];

function FitGhanaBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(GHANA_BOUNDS, { padding: [10, 10], maxZoom: 7 });
    map.setMaxBounds([
      [3.5, -4.5],
      [12.5, 2.5],
    ]);
    map.setMinZoom(6);
  }, [map]);
  return null;
}

function getColor(value: number, max: number): string {
  const ratio = Math.min(value / Math.max(max, 1), 1);
  if (ratio > 0.7) return '#22C55E';
  if (ratio > 0.4) return '#3B82F6';
  if (ratio > 0.2) return '#F59E0B';
  return '#EF4444';
}

function getDesertColor(severity?: string): string {
  if (severity === 'critical') return '#EF4444';
  if (severity === 'high') return '#F59E0B';
  if (severity === 'moderate') return '#EAB308';
  return '#22C55E';
}

interface GhanaMapProps {
  regions: RegionalSummary[];
  mode?: 'density' | 'desert';
  height?: number;
  onRegionClick?: (region: string) => void;
}

export default function GhanaMap({ regions, mode = 'density', height = 500, onRegionClick }: GhanaMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        style={{
          height,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        Loading map…
      </div>
    );
  }

  const maxFacilities = Math.max(...regions.map((r) => r.total_facilities), 1);

  return (
    <div className="map-wrapper" style={{ height }}>
      <MapContainer
        center={GHANA_CENTER}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitGhanaBounds />
        {regions.map((region) => {
          const coords = REGION_COORDINATES[region.address_stateOrRegion];
          if (!coords) return null;

          const color =
            mode === 'desert'
              ? getDesertColor(region.desert_severity)
              : getColor(region.total_facilities, maxFacilities);

          const radius =
            mode === 'desert'
              ? region.is_medical_desert ? 18 : 10
              : Math.max(8, Math.min(25, (region.total_facilities / maxFacilities) * 25));

          return (
            <CircleMarker
              key={region.address_stateOrRegion}
              center={coords}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.6,
                color: color,
                weight: 2,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => onRegionClick?.(region.address_stateOrRegion),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 8, color: '#0f172a' }}>
                    {region.address_stateOrRegion}
                  </div>
                  <div style={{ display: 'grid', gap: 4, fontSize: '0.8125rem', color: '#334155' }}>
                    <div>Facilities: <strong>{region.total_facilities}</strong></div>
                    <div>Doctors: <strong>{region.total_doctors}</strong></div>
                    <div>Beds: <strong>{region.total_bed_capacity}</strong></div>
                    {region.is_medical_desert && (
                      <div style={{ color: '#EF4444', fontWeight: 600, marginTop: 4 }}>
                        ⚠ Medical Desert ({region.desert_severity})
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
