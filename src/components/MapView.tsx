import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LatestVehicleLocation, TripWaypoint, Geofence } from '../types';
import { colors } from '../theme/colors';

interface MapViewProps {
  vehicles?: LatestVehicleLocation[];
  selectedVehicleId?: string;
  onSelectVehicle?: (vehicle: LatestVehicleLocation) => void;
  waypoints?: TripWaypoint[];
  currentPlaybackIndex?: number;
  geofences?: Geofence[];
  height?: number | string;
  center?: [number, number];
  zoom?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  vehicles = [],
  selectedVehicleId,
  onSelectVehicle,
  waypoints = [],
  currentPlaybackIndex = 0,
  geofences = [],
  height = '100%',
  center = [18.5912, 73.7389],
  zoom = 12,
}) => {
  const containerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const playbackMarkerRef = useRef<any>(null);

  // For Web platform: load Leaflet dynamically
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Ensure Leaflet CSS is in head
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Ensure Leaflet script is loaded
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !containerRef.current || mapInstanceRef.current) return;

      // Initialize Leaflet Map
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update vehicle markers
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear old vehicle markers
    Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m));
    markersRef.current = {};

    vehicles.forEach((v) => {
      const lat = v.latitude;
      const lon = v.longitude;
      if (!lat || !lon) return;

      let pinColor = colors.statusDisconnected;
      if (v.panic_status === 1) pinColor = colors.statusEmergency;
      else if (v.movement_status === 'moving') pinColor = colors.statusMoving;
      else if (v.movement_status === 'idle') pinColor = colors.statusIdle;
      else if (v.movement_status === 'stopped') pinColor = colors.statusStopped;

      const isSelected = selectedVehicleId === v.vehicle_id;
      const heading = v.heading || 0;

      // Rotated vehicle icon with direction arrow
      const customIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${
              v.panic_status === 1
                ? `<div style="
                    position: absolute;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(220, 53, 69, 0.4);
                    animation: pulse 1.2s infinite;
                  "></div>`
                : ''
            }
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${pinColor};
              border: 2.5px solid ${isSelected ? '#FFFFFF' : '#0B1E38'};
              box-shadow: 0 3px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${heading}deg);
              transition: transform 0.3s ease;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.5">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        if (onSelectVehicle) onSelectVehicle(v);
      });

      markersRef.current[v.vehicle_id] = marker;
    });

    // Auto-fit if vehicles exist and none explicitly selected
    if (vehicles.length > 0 && !selectedVehicleId) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [vehicles, selectedVehicleId]);

  // Handle selected vehicle center
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapInstanceRef.current || !selectedVehicleId) return;
    const target = vehicles.find((v) => v.vehicle_id === selectedVehicleId);
    if (target && target.latitude && target.longitude) {
      mapInstanceRef.current.setView([target.latitude, target.longitude], 15, { animate: true });
    }
  }, [selectedVehicleId]);

  // Handle route waypoints and playback
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstanceRef.current;

    // Remove previous polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (playbackMarkerRef.current) {
      map.removeLayer(playbackMarkerRef.current);
      playbackMarkerRef.current = null;
    }

    if (waypoints.length > 0) {
      const coords = waypoints.map((w) => [w.latitude, w.longitude]);
      polylineRef.current = L.polyline(coords, {
        color: colors.primaryNavy,
        weight: 4.5,
        opacity: 0.85,
        dashArray: '1, 6',
      }).addTo(map);

      // Plot high-contrast stoppage markers per PRD Section 4.3 / 11
      waypoints.forEach((w, idx) => {
        if (w.is_stop === 1) {
          const stopIcon = L.divIcon({
            className: 'stoppage-marker',
            html: `
              <div style="
                background: #DC3545;
                color: #FFFFFF;
                border: 2px solid #FFFFFF;
                border-radius: 8px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: 800;
                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 3px;
              ">
                <span>🛑</span>
                <span>${w.stop_duration_min || 5}m</span>
              </div>
            `,
            iconSize: [60, 24],
            iconAnchor: [30, 24],
          });
          L.marker([w.latitude, w.longitude], { icon: stopIcon }).addTo(map);
        }
      });

      // Playback active marker
      const curr = waypoints[currentPlaybackIndex] || waypoints[0];
      if (curr) {
        const replayIcon = L.divIcon({
          className: 'replay-vehicle-marker',
          html: `
            <div style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: ${colors.statusMoving};
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${curr.heading || 0}deg);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.5">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        playbackMarkerRef.current = L.marker([curr.latitude, curr.longitude], { icon: replayIcon }).addTo(map);
        map.panTo([curr.latitude, curr.longitude]);
      }

      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    }
  }, [waypoints, currentPlaybackIndex]);

  // Geofences rendering
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapInstanceRef.current || geofences.length === 0) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstanceRef.current;

    geofences.forEach((geo) => {
      if (geo.zone_type === 'circular' && geo.latitude && geo.longitude) {
        L.circle([geo.latitude, geo.longitude], {
          radius: geo.radius_meters || 500,
          color: colors.accentBlue,
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          weight: 2,
        })
          .addTo(map)
          .bindTooltip(`Geofence: ${geo.name}`, { permanent: false });
      }
    });
  }, [geofences]);

  return (
    <View style={[styles.mapContainer, { height }]}>
      {Platform.OS === 'web' ? (
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        />
      ) : (
        <View style={styles.nativeFallback}>
          {/* Native fallback wrapper */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  nativeFallback: {
    flex: 1,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
