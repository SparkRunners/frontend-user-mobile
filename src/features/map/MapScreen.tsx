import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import { theme } from '../../theme';
import { fetchScooters, Scooter } from '../scooters/api';
import { ScanScreen } from '../scan';
import { useRide, RideDashboard, TripSummary } from '../ride';
import Toast from 'react-native-toast-message';

const STOCKHOLM_REGION = {
  latitude: 59.3293,
  longitude: 18.0686,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const MapScreen = () => {
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const { startRide, isRiding } = useRide();

  useEffect(() => {
    const loadScooters = async () => {
      try {
        const data = await fetchScooters();
        setScooters(data);
      } catch (error) {
        console.error('Failed to fetch scooters:', error);
        Alert.alert('Error', 'Failed to load scooters');
      }
    };

    loadScooters();
  }, []);

  const handleScanSuccess = async (code: string) => {
    setShowScanner(false);
    
    // Parse scooter ID from code (assuming code is the ID for now)
    // In a real app, we might validate the format
    const scooterId = code;

    try {
      Toast.show({
        type: 'info',
        text1: 'Låser upp...',
        position: 'bottom',
      });

      await startRide(scooterId);
      
      Toast.show({
        type: 'success',
        text1: 'Upplåst!',
        text2: 'Du kan nu börja din resa.',
        position: 'bottom',
      });
      
    } catch (error) {
      console.error('Unlock failed:', error);
      Alert.alert('Fel', 'Kunde inte låsa upp skotern. Försök igen.');
    }
  };

  return (
    <View style={styles.container}>
      {showScanner ? (
        <ScanScreen
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      ) : (
        <>
          <MapView
            testID="map-view"
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={STOCKHOLM_REGION}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={() => setSelectedScooter(null)}
          >
            {scooters.map((scooter) => {
              const latitude = scooter.coordinates?.latitude;
              const longitude = scooter.coordinates?.longitude;

              if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return null;
              }

              return (
                <Marker
                  key={scooter.id}
                  testID={`marker-${scooter.id}`}
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  onPress={(e) => {
                    if (e && e.stopPropagation) {
                      e.stopPropagation();
                    }
                    setSelectedScooter(scooter);
                  }}
                >
                  <View style={[
                    styles.marker,
                    selectedScooter?.id === scooter.id && styles.markerSelected
                  ]}>
                    <View style={styles.markerIcon} />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {isRiding ? (
            <RideDashboard />
          ) : (
            !selectedScooter && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <Text style={styles.scanButtonText}>Skanna</Text>
              </TouchableOpacity>
            )
          )}

          {selectedScooter && (
            <View style={styles.bottomSheet}>
              <View style={styles.handle} />
              <Text style={styles.scooterId}>Scooter ID: {selectedScooter.id}</Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Batteri</Text>
                  <Text style={styles.statValue}>{selectedScooter.battery}%</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Avstånd</Text>
                  <Text style={styles.statValue}>300 m bort</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setSelectedScooter(null);
                  setShowScanner(true);
                }}
              >
                <Text style={styles.actionButtonText}>Starta resa</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      <TripSummary />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    width: 30,
    height: 30,
    backgroundColor: '#4ADE80', // Green-400
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSelected: {
    width: 40,
    height: 40,
    backgroundColor: '#22C55E', // Green-500
    zIndex: 10,
  },
  markerIcon: {
    width: 10,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scooterId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
