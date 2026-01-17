import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { theme } from '../../theme';

interface ScanScreenProps {
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  devMockCode?: string | null;
  isRideLocked?: boolean;
  onRideLockedAttempt?: () => void;
}

export const ScanScreen = ({
  onClose,
  onScanSuccess,
  devMockCode,
  isRideLocked = false,
  onRideLockedAttempt,
}: ScanScreenProps) => {
  const [isScanning, setIsScanning] = useState(true);
  const isScanningRef = useRef(true);

  const forwardScan = (code: string) => {
    if (!isScanningRef.current) return;
    
    isScanningRef.current = false;
    setIsScanning(false);
    
    if (isRideLocked) {
      onRideLockedAttempt?.();
      return;
    }
    onScanSuccess(code);
  };

  const onReadCode = (event: any) => {
    if (!isScanning) return;
    
    const code = event?.nativeEvent?.codeStringValue;
    if (code) {
      forwardScan(code);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        scanBarcode={true}
        onReadCode={onReadCode}
        showFrame={true}
        laserColor={theme.colors.brand}
        frameColor="white"
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Stäng</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Skanna QR-kod</Text>
        <View style={styles.headerSpacer} /> 
      </View>

      <View style={styles.overlay}>
        <Text style={styles.instructionText}>
          Rikta kameran mot QR-koden på styret
        </Text>
        
        {/* Dev Helper: Simulate Scan */}
        {__DEV__ && devMockCode ? (
          <TouchableOpacity
            style={styles.devButton}
            onPress={() => forwardScan(devMockCode)}
          >
            <Text style={styles.devButtonText}>[DEV] Simulera Skanning</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 60,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  devButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  devButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerSpacer: {
    width: 60,
  },
});
