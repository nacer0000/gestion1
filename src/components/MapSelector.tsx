import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
  initialPosition?: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

function LocationMarker({ onPositionChange, onAddressChange }: { 
  onPositionChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}) {
  const [position, setPosition] = useState<LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng.lat, e.latlng.lng);
      
      // Géocodage inverse pour obtenir l'adresse
      if (onAddressChange) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
          .then(response => response.json())
          .then(data => {
            if (data.display_name) {
              onAddressChange(data.display_name);
            }
          })
          .catch(error => console.error('Erreur géocodage:', error));
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export const MapSelector: React.FC<MapSelectorProps> = ({ 
  initialPosition = { lat: 33.5731, lng: -7.5898 }, // Casablanca par défaut
  onPositionChange,
  onAddressChange
}) => {
  const [mapPosition, setMapPosition] = useState<[number, number]>([
    initialPosition.lat, 
    initialPosition.lng
  ]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (initialPosition.lat !== 0 && initialPosition.lng !== 0) {
      setMapPosition([initialPosition.lat, initialPosition.lng]);
    }
  }, [initialPosition]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par ce navigateur');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setMapPosition([lat, lng]);
        onPositionChange(lat, lng);
        
        // Obtenir l'adresse de la position actuelle
        if (onAddressChange) {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
              if (data.display_name) {
                onAddressChange(data.display_name);
              }
            })
            .catch(error => console.error('Erreur géocodage:', error));
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé';
            break;
        }
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Bouton pour obtenir la position actuelle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          <MapPin className="h-4 w-4" />
          <span>
            {isGettingLocation ? 'Localisation en cours...' : 'Choisir ma place actuelle'}
          </span>
        </button>
      </div>

      {/* Carte */}
      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={mapPosition}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          key={`${mapPosition[0]}-${mapPosition[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            onPositionChange={onPositionChange} 
            onAddressChange={onAddressChange}
          />
          {initialPosition.lat !== 0 && initialPosition.lng !== 0 && (
            <Marker position={mapPosition} />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500">
        💡 Astuce: Cliquez sur "Choisir ma place actuelle" pour utiliser votre position GPS, ou cliquez directement sur la carte pour définir la position.
      </p>
    </div>
  );
};