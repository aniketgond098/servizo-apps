import React, { useEffect, useRef, useState } from 'react';
import { Specialist, AvailabilityStatus } from '../types';

declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  specialists: Specialist[];
  userLoc: { lat: number; lng: number } | null;
  getAvailabilityColor: (status: AvailabilityStatus) => string;
  showRoute?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ specialists, userLoc, getAvailabilityColor, showRoute = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const hoverRouteLayerRef = useRef<any>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const isMobile = window.innerWidth < 768;

  const statusColors: Record<string, { border: string; bg: string; dot: string; label: string }> = {
    available: { border: '#22c55e', bg: '#dcfce7', dot: '#16a34a', label: 'Available' },
    busy: { border: '#ef4444', bg: '#fee2e2', dot: '#dc2626', label: 'Busy' },
    unavailable: { border: '#f59e0b', bg: '#fef3c7', dot: '#d97706', label: 'Away' },
  };

  const getStatusStyle = (status: string) => statusColors[status] || statusColors.unavailable;

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const center = userLoc || { lat: 19.0760, lng: 72.8777 };
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
      }).setView([center.lat, center.lng], 13);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      if (isMobile) {
        mapInstanceRef.current.on('click', () => {
          markersRef.current.forEach(m => m.closePopup());
          setSelectedSpecialist(null);
          if (hoverRouteLayerRef.current) {
            mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
            hoverRouteLayerRef.current = null;
          }
        });
      }
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (hoverRouteLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
      hoverRouteLayerRef.current = null;
    }

    // User location marker with pulse
    if (userLoc) {
      const userIcon = window.L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(26,115,232,0.12);animation:pulse-ring 2s ease-out infinite;"></div>
            <div style="position:absolute;inset:0;background:#1a73e8;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.4);"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const userMarker = window.L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current);
      markersRef.current.push(userMarker);
    }

    // Specialist markers
    specialists.forEach((specialist) => {
      if (specialist.id === 'user-location') return;

      const style = getStatusStyle(specialist.availability);

      const markerIcon = window.L.divIcon({
        className: 'custom-specialist-marker',
        html: `
          <div style="position:relative;cursor:pointer;">
            <div style="width:46px;height:46px;border-radius:14px;overflow:hidden;border:2.5px solid ${style.border};box-shadow:0 4px 12px rgba(0,0,0,0.1);background:white;">
              <img src="${specialist.avatar}" alt="${specialist.name}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="position:absolute;top:-5px;right:-6px;background:white;border:1.5px solid ${style.border};border-radius:8px;padding:1px 5px;font-size:9px;font-weight:700;color:#1a2b49;box-shadow:0 2px 6px rgba(0,0,0,0.08);white-space:nowrap;">
              ₹${specialist.hourlyRate}
            </div>
            <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:${style.dot};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.1);"></div>
          </div>
        `,
        iconSize: [48, 52],
        iconAnchor: [24, 52]
      });

      const marker = window.L.marker([specialist.lat, specialist.lng], { icon: markerIcon })
        .addTo(mapInstanceRef.current);
      markersRef.current.push(marker);

      const popupContent = `
        <div style="font-family:Inter,sans-serif;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:40px;height:40px;border-radius:12px;overflow:hidden;border:2px solid ${style.border};flex-shrink:0;">
              <img src="${specialist.avatar}" alt="${specialist.name}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13px;color:#1a2b49;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${specialist.name}</div>
              <div style="font-size:11px;color:#1a73e8;font-weight:600;">${specialist.category}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid #f1f5f9;margin-bottom:10px;">
            <div>
              <span style="font-size:15px;font-weight:700;color:#1a2b49;">₹${specialist.hourlyRate}</span>
              <span style="font-size:10px;color:#94a3b8;">/hr</span>
            </div>
            <div style="width:1px;height:14px;background:#e2e8f0;"></div>
            <div style="display:flex;align-items:center;gap:3px;">
              <span style="color:#facc15;font-size:12px;">★</span>
              <span style="font-size:12px;font-weight:700;color:#1a2b49;">${specialist.rating}</span>
            </div>
            <div style="width:1px;height:14px;background:#e2e8f0;"></div>
            <div style="display:flex;align-items:center;gap:4px;">
              <div style="width:6px;height:6px;border-radius:50%;background:${style.dot};"></div>
              <span style="font-size:10px;font-weight:600;color:${style.dot};">${style.label}</span>
            </div>
          </div>
          <a href="#/profile/${specialist.id}" 
             style="display:block;width:100%;padding:8px 0;background:#1a2b49;color:white;text-align:center;border-radius:10px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
            View Profile
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        className: 'servizo-popup',
        closeButton: false,
        autoPan: true,
        autoClose: false,
        closeOnClick: false
      });

      const fetchRoute = (from: {lat: number, lng: number}, to: {lat: number, lng: number}, color: string, dashed: boolean, targetRef: 'hover' | 'route') => {
        if (!mapInstanceRef.current) return;
        fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes?.[0] && mapInstanceRef.current) {
              const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              const polyline = window.L.polyline(coords, {
                color,
                weight: dashed ? 3 : 4,
                opacity: dashed ? 0.7 : 0.9,
                dashArray: dashed ? '8, 6' : undefined,
              }).addTo(mapInstanceRef.current);
              if (targetRef === 'hover') hoverRouteLayerRef.current = polyline;
              else routeLayerRef.current = polyline;
            }
          })
          .catch(() => {
            if (mapInstanceRef.current) {
              const polyline = window.L.polyline(
                [[from.lat, from.lng], [to.lat, to.lng]],
                { color, weight: dashed ? 3 : 4, opacity: dashed ? 0.7 : 0.9, dashArray: dashed ? '8, 6' : undefined }
              ).addTo(mapInstanceRef.current);
              if (targetRef === 'hover') hoverRouteLayerRef.current = polyline;
              else routeLayerRef.current = polyline;
            }
          });
      };

      const clearHoverRoute = () => {
        if (hoverRouteLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
          hoverRouteLayerRef.current = null;
        }
      };

      marker.on('mouseover', () => {
        if (isMobile) return;
        marker.openPopup();
        if (!showRoute && userLoc) fetchRoute(userLoc, { lat: specialist.lat, lng: specialist.lng }, style.border, true, 'hover');
      });

      marker.on('mouseout', () => {
        if (isMobile) return;
        marker.closePopup();
        clearHoverRoute();
      });

      marker.on('click', (e: any) => {
        if (isMobile && !showRoute) {
          if (e.originalEvent) e.originalEvent.stopPropagation();
          if (selectedSpecialist?.id === specialist.id) {
            setSelectedSpecialist(null);
            marker.closePopup();
            clearHoverRoute();
          } else {
            markersRef.current.forEach(m => m.closePopup());
            setSelectedSpecialist(specialist);
            setTimeout(() => marker.openPopup(), 0);
            clearHoverRoute();
            if (userLoc) fetchRoute(userLoc, { lat: specialist.lat, lng: specialist.lng }, style.border, true, 'hover');
          }
        }
      });
    });

    // Route for live tracking mode
    if (showRoute && userLoc && specialists.length > 0 && mapInstanceRef.current) {
      const workerSpec = specialists.find(s => s.name.includes('Worker'));
      if (workerSpec) {
        fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${workerSpec.lng},${workerSpec.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes?.[0] && mapInstanceRef.current) {
              const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              routeLayerRef.current = window.L.polyline(coords, {
                color: '#1a73e8',
                weight: 4,
                opacity: 0.9
              }).addTo(mapInstanceRef.current);
              mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
            }
          })
          .catch(() => {
            if (mapInstanceRef.current) {
              routeLayerRef.current = window.L.polyline(
                [[userLoc.lat, userLoc.lng], [workerSpec.lat, workerSpec.lng]],
                { color: '#1a73e8', weight: 4, opacity: 0.9 }
              ).addTo(mapInstanceRef.current);
              mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
            }
          });
      }
    }

    // Auto-zoom to nearest specialist on listing map
    if (!showRoute && userLoc && specialists.length > 0 && mapInstanceRef.current) {
      const validSpecs = specialists.filter(s => s.id !== 'user-location');
      if (validSpecs.length > 0) {
        const nearest = validSpecs.reduce((prev, curr) => {
          const prevDist = Math.sqrt(Math.pow(prev.lat - userLoc.lat, 2) + Math.pow(prev.lng - userLoc.lng, 2));
          const currDist = Math.sqrt(Math.pow(curr.lat - userLoc.lat, 2) + Math.pow(curr.lng - userLoc.lng, 2));
          return currDist < prevDist ? curr : prev;
        });

        const bounds = window.L.latLngBounds(
          [userLoc.lat, userLoc.lng],
          [nearest.lat, nearest.lng]
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });

        const nearestMarker = markersRef.current.find(m => {
          const ll = m.getLatLng();
          return Math.abs(ll.lat - nearest.lat) < 0.0001 && Math.abs(ll.lng - nearest.lng) < 0.0001;
        });
        if (nearestMarker) {
          const style = getStatusStyle(nearest.availability);
          setTimeout(() => nearestMarker.openPopup(), 300);

          fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${nearest.lng},${nearest.lat}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
              if (data.routes?.[0] && mapInstanceRef.current) {
                const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                hoverRouteLayerRef.current = window.L.polyline(coords, {
                  color: style.border,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '8, 6'
                }).addTo(mapInstanceRef.current);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [specialists, userLoc, showRoute]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '600px' }} />
      
      {!showRoute && (
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          {Object.entries(statusColors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: val.dot }}></div>
              <span className="text-gray-500 font-medium">{val.label}</span>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .custom-user-marker, .custom-specialist-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          background: #f8fafc !important;
          font-family: 'Inter', sans-serif !important;
        }
        .servizo-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 14px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
          min-width: 200px !important;
        }
        .servizo-popup .leaflet-popup-content {
          margin: 0 !important;
          font-family: 'Inter', sans-serif !important;
        }
        .servizo-popup .leaflet-popup-tip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #1a2b49 !important;
          border: 1px solid #e2e8f0 !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f8fafc !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
