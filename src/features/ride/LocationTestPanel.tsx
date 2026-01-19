import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Test locations based on real zones in database
const TEST_LOCATIONS = [
  // Malmö zones
  {
    name: '🟢 Outside Zones - Malmö',
    lat: 55.6100,
    lon: 13.0200,
    description: 'Not in any zone, normal riding allowed'
  },
  {
    name: '🟡 Slow-speed - Malmö City Center',
    lat: 55.5956,
    lon: 13.0070,
    description: 'Speed limited zone (13.001385-13.012704, 55.59300-55.59825)'
  },
  {
    name: '🅿️ Parking - Malmö Center',
    lat: 55.5951,
    lon: 13.0062,
    description: 'Parking zone (13.003956-13.008515, 55.59379-55.59639)'
  },
  {
    name: '🔴 No-go - Skånes Hospital',
    lat: 55.5873,
    lon: 13.0025,
    description: 'Hospital no-go zone (12.998494-13.006189, 55.58510-55.58956)'
  },
  {
    name: '⚡ Charging - Malmö Center',
    lat: 55.5946,
    lon: 13.0049,
    description: 'Charging station (Point: 13.004868, 55.59456)'
  },
  {
    name: '🅿️ Parking - Malmö North',
    lat: 55.6057,
    lon: 13.0074,
    description: 'North parking zone (13.003697-13.011042, 55.60455-55.60691)'
  },
  // Stockholm zones
  {
    name: '🟢 Outside Zones - Stockholm',
    lat: 59.3400,
    lon: 18.0400,
    description: 'Stockholm normal area outside zones'
  },
  {
    name: '🅿️ Parking - Stockholm North',
    lat: 59.3464,
    lon: 18.0614,
    description: 'Stockholm north parking zone (18.05797-18.06483, 59.34524-59.34754)'
  },
  {
    name: '🅿️ Parking - Stockholm West',
    lat: 59.3370,
    lon: 18.0543,
    description: 'Stockholm west parking zone (18.05204-18.05656, 59.33616-59.33797)'
  },
];

interface LocationTestPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationTestPanel: React.FC<LocationTestPanelProps> = ({ visible, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState<string>('Unknown');

  if (!visible) return null;

  const mockLocation = (lat: number, lon: number, name: string) => {
    // Note: This won't actually change the device location in production
    // It's for testing with iOS Simulator or development builds
    console.log(`[LocationTest] Mock location: ${name} (${lat}, ${lon})`);
    setCurrentLocation(name);
    
    // In development, you can manually trigger zone checks
    // by calling your zone check API with these coordinates
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        console.log('[LocationTest] Current location:', latitude, longitude);
      },
      (error) => {
        console.error('[LocationTest] Error:', error);
      }
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>GPS Zone Test Tool</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.currentLocation}>
          <Text style={styles.label}>Current Location:</Text>
          <Text style={styles.locationText}>{currentLocation}</Text>
          <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Simulate GPS Location (iOS Simulator):</Text>
        <ScrollView style={styles.locationList}>
          {TEST_LOCATIONS.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.locationItem}
              onPress={() => mockLocation(location.lat, location.lon, location.name)}
            >
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationCoords}>
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </Text>
              <Text style={styles.locationDesc}>{location.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            1. iOS Simulator: Debug → Simulate Location{'\n'}
            2. Use coordinates above to create GPX file{'\n'}
            3. Or select Custom Location in Xcode and enter coordinates
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  panel: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  currentLocation: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationList: {
    maxHeight: 300,
  },
  locationItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  locationDesc: {
    fontSize: 13,
    color: '#888',
  },
  instructions: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
