import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { theme } from '../../theme';

interface ScanScreenProps {
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const ScanScreen = ({ onClose, onScanSuccess }: ScanScreenProps) => {
  const [isScanning, setIsScanning] = useState(true);

  const onReadCode = (event: any) => {
    if (!isScanning) return;
    
    const code = event.nativeEvent.codeStringValue;
    if (code) {
      setIsScanning(false);
      onScanSuccess(code);
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
        <View style={{ width: 60 }} /> 
      </View>

      <View style={styles.overlay}>
        <Text style={styles.instructionText}>
          Rikta kameran mot QR-koden på styret
        </Text>
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
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
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
});
