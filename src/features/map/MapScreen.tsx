import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../../theme';

const STOCKHOLM_REGION = {
  latitude: 59.3293,
  longitude: 18.0686,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const MapScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        testID="map-view"
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={STOCKHOLM_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
      />
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
});
