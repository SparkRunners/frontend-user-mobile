import React, { useState, useRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Marker, Polygon } from 'react-native-maps';
import { theme } from '../../theme';
import { Scooter } from '../scooters/api';
import { ScanScreen } from '../scan';
import { useRide, RideDashboard, TripSummary } from '../ride';
import Toast from 'react-native-toast-message';
import { useZones } from './zones/useZones';
import { usePricing } from '../pricing/usePricing';
import { useScootersFeed } from '../scooters/useScootersFeed';

const STOCKHOLM_REGION = {
  latitude: 59.3293,
  longitude: 18.0686,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MIN_DELTA = 0.005;
const MAX_DELTA = 0.5;
const ZOOM_FACTOR = 0.5;

const formatPrice = (value: number, currency: string) => {
  const hasFraction = Math.abs(value % 1) > 0;
  const formatted = hasFraction ? value.toFixed(2) : value.toFixed(0);
  return `${formatted} ${currency}`;
};

export const MapScreen = () => {
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [mapRegion, setMapRegion] = useState(STOCKHOLM_REGION);
  const mapRef = useRef<MapView | null>(null);
  const { startRide, isRiding } = useRide();
  const { allowedZones, parkingZones } = useZones();
  const {
    pricing,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: refetchPricing,
  } = usePricing();
  const {
    scooters,
    isLoading: scootersLoading,
    error: scootersError,
    refetch: refetchScooters,
  } = useScootersFeed();
  const hasScootersAvailable = scooters.length > 0;
  const shouldShowInitialLoader = scootersLoading && !hasScootersAvailable && !scootersError;
  const isScanDisabled = scootersLoading && !hasScootersAvailable;

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

  const adjustZoom = useCallback((scale: number) => {
    setMapRegion(prev => {
      const nextLatitudeDelta = Math.min(
        Math.max(prev.latitudeDelta * scale, MIN_DELTA),
        MAX_DELTA,
      );
      const nextLongitudeDelta = Math.min(
        Math.max(prev.longitudeDelta * scale, MIN_DELTA),
        MAX_DELTA,
      );
      const nextRegion = {
        ...prev,
        latitudeDelta: nextLatitudeDelta,
        longitudeDelta: nextLongitudeDelta,
      };
      mapRef.current?.animateToRegion?.(nextRegion, 200);
      return nextRegion;
    });
  }, []);

  const handleZoomIn = useCallback(() => adjustZoom(ZOOM_FACTOR), [adjustZoom]);
  const handleZoomOut = useCallback(() => adjustZoom(1 / ZOOM_FACTOR), [adjustZoom]);

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
            ref={mapRef}
            testID="map-view"
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={STOCKHOLM_REGION}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={() => setSelectedScooter(null)}
            onRegionChangeComplete={region => setMapRegion(region)}
          >
            {allowedZones.map(zone => (
              <Polygon
                key={zone.id}
                coordinates={zone.coordinates}
                strokeColor="rgba(14,165,233,0.7)"
                fillColor="rgba(14,165,233,0.12)"
                strokeWidth={2}
              />
            ))}

            {parkingZones.map(zone => (
              <Polygon
                key={zone.id}
                coordinates={zone.coordinates}
                strokeColor="rgba(34,197,94,0.9)"
                fillColor="rgba(34,197,94,0.18)"
                strokeWidth={2}
              />
            ))}

            {scooters.map((scooter, index) => {
              const latitude = scooter.coordinates?.latitude;
              const longitude = scooter.coordinates?.longitude;

              if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return null;
              }
              const markerKey = scooter.id ?? index;

              return (
                <Marker
                  key={`${markerKey}-${latitude}-${longitude}`}
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
                testID="scan-button"
                style={[
                  styles.scanButton,
                  isScanDisabled && styles.scanButtonDisabled,
                ]}
                onPress={() => setShowScanner(true)}
                disabled={isScanDisabled}
                accessibilityState={{ disabled: isScanDisabled }}
              >
                <Text style={styles.scanButtonText}>
                  {isScanDisabled ? 'Hämtar...' : 'Skanna'}
                </Text>
              </TouchableOpacity>
            )
          )}

          {shouldShowInitialLoader ? (
            <View style={styles.feedLoadingContainer} testID="scooter-feed-loading">
              <ActivityIndicator color={theme.colors.brand} size="small" />
              <Text style={styles.feedLoadingText}>Hämtar skotrar...</Text>
            </View>
          ) : null}

          {scootersError ? (
            <TouchableOpacity
              style={styles.feedErrorBanner}
              onPress={refetchScooters}
              testID="scooter-feed-error"
            >
              <Text style={styles.feedErrorText}>{scootersError}</Text>
              <Text style={styles.feedRetryText}>Tryck för att försöka igen</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.legendContainer} testID="zone-legend">
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, styles.allowedSwatch]} />
              <Text style={styles.legendLabel}>Tillåten zon</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, styles.parkingSwatch]} />
              <Text style={styles.legendLabel}>Parkeringszon</Text>
            </View>
          </View>

          <View style={styles.zoomControls} testID="zoom-controls">
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleZoomIn}
              testID="zoom-in-button"
            >
              <Text style={styles.zoomLabel}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleZoomOut}
              testID="zoom-out-button"
            >
              <Text style={styles.zoomLabel}>-</Text>
            </TouchableOpacity>
          </View>

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

              <View style={styles.pricingCard} testID="pricing-info">
                <View style={styles.pricingHeaderRow}>
                  <Text style={styles.pricingTitle}>Priser</Text>
                  {pricing?.updatedAt ? (
                    <Text style={styles.pricingUpdated}>
                      Uppdaterad {new Date(pricing.updatedAt).toLocaleDateString('sv-SE')}
                    </Text>
                  ) : null}
                </View>
                {pricingLoading ? (
                  <View style={styles.pricingLoadingRow}>
                    <ActivityIndicator color={theme.colors.brand} size="small" />
                    <Text style={styles.pricingLoadingText}>Hämtar prisinfo...</Text>
                  </View>
                ) : pricing ? (
                  <>
                    <View style={styles.pricingValues}>
                      <View style={styles.pricingValueCol}>
                        <Text style={styles.pricingLabel}>Startavgift</Text>
                        <Text style={styles.pricingValue}>
                          {formatPrice(pricing.baseFare, pricing.currency)}
                        </Text>
                      </View>
                      <View style={styles.pricingDivider} />
                      <View style={styles.pricingValueCol}>
                        <Text style={styles.pricingLabel}>Minutpris</Text>
                        <Text style={styles.pricingValue}>
                          {formatPrice(pricing.perMinute, pricing.currency)}/min
                        </Text>
                      </View>
                    </View>
                    {pricing.note ? (
                      <Text style={styles.pricingNote}>{pricing.note}</Text>
                    ) : null}
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={refetchPricing}
                    style={styles.pricingErrorContainer}
                  >
                    <Text style={styles.pricingErrorText}>
                      {pricingError ?? 'Kunde inte hämta prisinfo.'}
                    </Text>
                    <Text style={styles.pricingRetryText}>Tryck för att försöka igen</Text>
                  </TouchableOpacity>
                )}
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
  pricingCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    gap: 12,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pricingUpdated: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  pricingValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingValueCol: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pricingDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  pricingNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  pricingLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingLoadingText: {
    color: theme.colors.text,
  },
  pricingErrorContainer: {
    backgroundColor: theme.colors.dangerMuted ?? 'rgba(220,38,38,0.08)',
    padding: 12,
    borderRadius: 12,
  },
  pricingErrorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  pricingRetryText: {
    color: theme.colors.text,
    fontSize: 12,
    marginTop: 4,
  },
  feedErrorBanner: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.dangerMuted ?? 'rgba(220,38,38,0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  feedErrorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  feedRetryText: {
    color: theme.colors.text,
    fontSize: 12,
    marginTop: 4,
  },
  feedLoadingContainer: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedLoadingText: {
    color: theme.colors.text,
    fontWeight: '600',
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
  scanButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legendContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  allowedSwatch: {
    backgroundColor: 'rgba(14,165,233,0.12)',
    borderColor: 'rgba(14,165,233,0.9)',
  },
  parkingSwatch: {
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderColor: 'rgba(34,197,94,0.9)',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
});
