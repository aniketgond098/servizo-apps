import React, { useEffect, useRef, useState } from 'react';
import { Specialist, AvailabilityStatus } from '../types';

declare global {
  interface Window {
    L: any;
  }
}

interface ExtendedMapViewProps {
  showRoute?: boolean;
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
  const [hoveredSpecialist, setHoveredSpecialist] = useState<Specialist | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const center = userLoc || { lat: 19.0760, lng: 72.8777 };
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
      }).setView([center.lat, center.lng], 13);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstanceRef.current);

      // Close popups on map click (mobile)
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

    // Clear existing route
    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Clear hover route
    if (hoverRouteLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
      hoverRouteLayerRef.current = null;
    }

    if (userLoc) {
      const userIcon = window.L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-2xl"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const userMarker = window.L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current);
      markersRef.current.push(userMarker);
    }

    specialists.forEach((specialist) => {
      // Skip rendering specialist marker for user location (already shown as blue dot)
      if (specialist.id === 'user-location') return;

      const borderColor = 
        specialist.availability === 'available' ? '#22c55e' :
        specialist.availability === 'busy' ? '#ef4444' : '#eab308';

      const markerIcon = window.L.divIcon({
        className: 'custom-specialist-marker',
        html: `
          <div class="relative cursor-pointer transition-transform hover:scale-110">
            <div class="w-12 h-12 rounded-full overflow-hidden shadow-lg" style="border: 3px solid ${borderColor};">
              <img src="${specialist.avatar}" alt="${specialist.name}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center text-[8px] font-bold" style="border: 2px solid ${borderColor};">
              ₹${specialist.hourlyRate}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const marker = window.L.marker([specialist.lat, specialist.lng], { icon: markerIcon })
        .addTo(mapInstanceRef.current);
      markersRef.current.push(marker);

      // Create popup content
      const popupContent = `
        <div class="flex items-center gap-2 mb-2">
          <img 
            src="${specialist.avatar}" 
            alt="${specialist.name}" 
            class="w-8 h-8 rounded-full border"
            style="border-color: ${borderColor}"
          />
          <div class="flex-1">
            <h3 class="font-bold text-white text-xs leading-tight">${specialist.name}</h3>
            <p class="text-[10px] text-blue-500 uppercase">${specialist.category}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-bold text-white">₹${specialist.hourlyRate}/hr</span>
          <span class="text-xs text-gray-400">•</span>
          <span class="text-xs text-white">⭐ ${specialist.rating}</span>
        </div>
        <a 
          href="#/profile/${specialist.id}" 
          class="block w-full bg-blue-600 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style="color: white;"
        >
          View Profile
        </a>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 200,
        className: 'custom-popup-no-wrapper',
        closeButton: false,
        autoPan: true,
        autoClose: false,
        closeOnClick: false
      });

      marker.on('mouseover', (e: any) => {
        if (isMobile) return;
        marker.openPopup();

        // Show route on hover if user location exists and not in showRoute mode
        if (userLoc && !showRoute && mapInstanceRef.current) {
          fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${specialist.lng},${specialist.lat}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes[0] && mapInstanceRef.current) {
                const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                hoverRouteLayerRef.current = window.L.polyline(coords, {
                  color: borderColor,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '10, 5'
                }).addTo(mapInstanceRef.current);
              }
            })
            .catch(() => {
              if (mapInstanceRef.current) {
                hoverRouteLayerRef.current = window.L.polyline(
                  [[userLoc.lat, userLoc.lng], [specialist.lat, specialist.lng]],
                  { color: borderColor, weight: 3, opacity: 0.7, dashArray: '10, 5' }
                ).addTo(mapInstanceRef.current);
              }
            });
        }
      });

      marker.on('mouseout', () => {
        if (isMobile) return;
        marker.closePopup();

        // Remove hover route
        if (hoverRouteLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
          hoverRouteLayerRef.current = null;
        }
      });

      marker.on('click', (e: any) => {
        if (isMobile && !showRoute) {
          if (e.originalEvent) e.originalEvent.stopPropagation();
          
          // Toggle popup and route
          if (selectedSpecialist?.id === specialist.id) {
            setSelectedSpecialist(null);
            marker.closePopup();
            if (hoverRouteLayerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
              hoverRouteLayerRef.current = null;
            }
          } else {
            // Close all other popups first
            markersRef.current.forEach(m => m.closePopup());
            setSelectedSpecialist(specialist);
            
            // Force open popup
            setTimeout(() => marker.openPopup(), 0);

            // Clear previous route
            if (hoverRouteLayerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(hoverRouteLayerRef.current);
              hoverRouteLayerRef.current = null;
            }

            // Show route
            if (userLoc && mapInstanceRef.current) {
              fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${specialist.lng},${specialist.lat}?overview=full&geometries=geojson`)
                .then(res => res.json())
                .then(data => {
                  if (data.routes && data.routes[0] && mapInstanceRef.current) {
                    const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                    hoverRouteLayerRef.current = window.L.polyline(coords, {
                      color: borderColor,
                      weight: 3,
                      opacity: 0.7,
                      dashArray: '10, 5'
                    }).addTo(mapInstanceRef.current);
                  }
                })
                .catch(() => {
                  if (mapInstanceRef.current) {
                    hoverRouteLayerRef.current = window.L.polyline(
                      [[userLoc.lat, userLoc.lng], [specialist.lat, specialist.lng]],
                      { color: borderColor, weight: 3, opacity: 0.7, dashArray: '10, 5' }
                    ).addTo(mapInstanceRef.current);
                  }
                });
            }
          }
        }
      });
    });

    // Add route if needed
    if (showRoute && userLoc && specialists.length > 0 && mapInstanceRef.current) {
      const workerLoc = specialists.find(s => s.name.includes('Worker'));
      if (workerLoc) {
        fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${workerLoc.lng},${workerLoc.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0] && mapInstanceRef.current) {
              const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              routeLayerRef.current = window.L.polyline(coords, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8
              }).addTo(mapInstanceRef.current);
            }
          })
          .catch(() => {
            if (mapInstanceRef.current) {
              routeLayerRef.current = window.L.polyline(
                [[userLoc.lat, userLoc.lng], [workerLoc.lat, workerLoc.lng]],
                { color: '#3b82f6', weight: 4, opacity: 0.8 }
              ).addTo(mapInstanceRef.current);
            }
          });
      }
    }

    // Auto-zoom to nearest specialist on initial load
    if (!showRoute && userLoc && specialists.length > 0 && mapInstanceRef.current) {
      const nearest = specialists.reduce((prev, curr) => {
        const prevDist = Math.sqrt(Math.pow(prev.lat - userLoc.lat, 2) + Math.pow(prev.lng - userLoc.lng, 2));
        const currDist = Math.sqrt(Math.pow(curr.lat - userLoc.lat, 2) + Math.pow(curr.lng - userLoc.lng, 2));
        return currDist < prevDist ? curr : prev;
      });

      const nearestMarker = markersRef.current.find(m => 
        m.getLatLng().lat === nearest.lat && m.getLatLng().lng === nearest.lng
      );

      if (nearestMarker) {
        const borderColor = 
          nearest.availability === 'available' ? '#22c55e' :
          nearest.availability === 'busy' ? '#ef4444' : '#eab308';

        // Fit bounds to show both user and nearest specialist
        const bounds = window.L.latLngBounds(
          [userLoc.lat, userLoc.lng],
          [nearest.lat, nearest.lng]
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });

        // Open popup
        setTimeout(() => nearestMarker.openPopup(), 300);

        // Show route
        fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${nearest.lng},${nearest.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0] && mapInstanceRef.current) {
              const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              hoverRouteLayerRef.current = window.L.polyline(coords, {
                color: borderColor,
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5'
              }).addTo(mapInstanceRef.current);
            }
          })
          .catch(() => {
            if (mapInstanceRef.current) {
              hoverRouteLayerRef.current = window.L.polyline(
                [[userLoc.lat, userLoc.lng], [nearest.lat, nearest.lng]],
                { color: borderColor, weight: 3, opacity: 0.7, dashArray: '10, 5' }
              ).addTo(mapInstanceRef.current);
            }
          });
      }
    }
  }, [specialists, userLoc, showRoute]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full rounded-3xl overflow-hidden border border-zinc-800" style={{ height: '600px' }} />
      
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-green-500"></div>
          <span className="text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-red-500"></div>
          <span className="text-gray-400">Busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-yellow-500"></div>
          <span className="text-gray-400">Not Available</span>
        </div>
      </div>
      
      <style>{`
        .custom-user-marker, .custom-specialist-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          background: #0a0a0a !important;
        }
        .custom-popup-no-wrapper .leaflet-popup-content-wrapper {
          background: #18181b !important;
          border: 1px solid #27272a !important;
          border-radius: 12px !important;
          padding: 10px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
          min-width: 180px !important;
        }
        .custom-popup-no-wrapper .leaflet-popup-content {
          margin: 0 !important;
        }
        .custom-popup-no-wrapper .leaflet-popup-tip {
          background: #18181b !important;
          border: 1px solid #27272a !important;
        }
      `}</style>
    </div>
  );
};
