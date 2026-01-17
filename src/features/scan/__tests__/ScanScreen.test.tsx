import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ScanScreen } from '../ScanScreen';

// Mock react-native-camera-kit
jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
}));

describe('ScanScreen', () => {
  const mockOnClose = jest.fn();
  const mockOnScanSuccess = jest.fn();
  const mockOnRideLockedAttempt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders camera and UI elements', () => {
      const { getByText } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      expect(getByText('Stäng')).toBeTruthy();
      expect(getByText('Skanna QR-kod')).toBeTruthy();
      expect(getByText('Rikta kameran mot QR-koden på styret')).toBeTruthy();
    });

    it('renders close button that calls onClose', () => {
      const { getByText } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      fireEvent.press(getByText('Stäng'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('QR Code Scanning', () => {
    it('calls onScanSuccess when QR code is scanned', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');

      act(() => {
        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'SCOOTER-123' },
        });
      });

      expect(mockOnScanSuccess).toHaveBeenCalledWith('SCOOTER-123');
    });

    it('does not call onScanSuccess when code is empty', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');
      camera.props.onReadCode({
        nativeEvent: { codeStringValue: '' },
      });

      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('does not call onScanSuccess when code is null', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');
      camera.props.onReadCode({
        nativeEvent: { codeStringValue: null },
      });

      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('only processes first scan when multiple scans occur', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');

      act(() => {
        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'FIRST-SCAN' },
        });

        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'SECOND-SCAN' },
        });
      });

      expect(mockOnScanSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnScanSuccess).toHaveBeenCalledWith('FIRST-SCAN');
    });
  });

  describe('Ride Locked Behavior', () => {
    it('calls onRideLockedAttempt instead of onScanSuccess when ride is locked', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          isRideLocked={true}
          onRideLockedAttempt={mockOnRideLockedAttempt}
        />,
      );

      const camera = UNSAFE_getByType('Camera');
      act(() => {
        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'SCOOTER-123' },
        });
      });

      expect(mockOnRideLockedAttempt).toHaveBeenCalledTimes(1);
      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('handles ride locked without onRideLockedAttempt callback', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          isRideLocked={true}
        />,
      );

      const camera = UNSAFE_getByType('Camera');
      
      // Should not throw
      expect(() => {
        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'SCOOTER-123' },
        });
      }).not.toThrow();

      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('allows scanning when isRideLocked is false', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          isRideLocked={false}
          onRideLockedAttempt={mockOnRideLockedAttempt}
        />,
      );

      const camera = UNSAFE_getByType('Camera');
      act(() => {
        camera.props.onReadCode({
          nativeEvent: { codeStringValue: 'SCOOTER-123' },
        });
      });

      expect(mockOnScanSuccess).toHaveBeenCalledWith('SCOOTER-123');
      expect(mockOnRideLockedAttempt).not.toHaveBeenCalled();
    });
  });

  describe('Dev Mock Button', () => {
    const originalDev = __DEV__;

    beforeAll(() => {
      // @ts-ignore - mocking __DEV__
      global.__DEV__ = true;
    });

    afterAll(() => {
      // @ts-ignore - restore __DEV__
      global.__DEV__ = originalDev;
    });

    it('shows dev button when devMockCode is provided in dev mode', () => {
      const { getByText } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          devMockCode="DEV-SCOOTER-123"
        />,
      );

      expect(getByText('[DEV] Simulera Skanning')).toBeTruthy();
    });

    it('does not show dev button when devMockCode is null', () => {
      const { queryByText } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          devMockCode={null}
        />,
      );

      expect(queryByText('[DEV] Simulera Skanning')).toBeNull();
    });

    it('does not show dev button when devMockCode is undefined', () => {
      const { queryByText } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      expect(queryByText('[DEV] Simulera Skanning')).toBeNull();
    });

    it('calls onScanSuccess when dev button is pressed', () => {
      const { getByText } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          devMockCode="MOCK-CODE-456"
        />,
      );

      act(() => {
        fireEvent.press(getByText('[DEV] Simulera Skanning'));
      });

      expect(mockOnScanSuccess).toHaveBeenCalledWith('MOCK-CODE-456');
    });

    it('calls onRideLockedAttempt when dev button pressed with locked ride', () => {
      const { getByText } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          devMockCode="MOCK-CODE"
          isRideLocked={true}
          onRideLockedAttempt={mockOnRideLockedAttempt}
        />,
      );

      act(() => {
        fireEvent.press(getByText('[DEV] Simulera Skanning'));
      });

      expect(mockOnRideLockedAttempt).toHaveBeenCalledTimes(1);
      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('prevents multiple dev button submissions', () => {
      const { getByText } = render(
        <ScanScreen
          onClose={mockOnClose}
          onScanSuccess={mockOnScanSuccess}
          devMockCode="MOCK-CODE"
        />,
      );

      const devButton = getByText('[DEV] Simulera Skanning');
      
      act(() => {
        fireEvent.press(devButton);
        fireEvent.press(devButton);
      });

      expect(mockOnScanSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('Camera Props', () => {
    it('passes correct props to Camera component', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');

      expect(camera.props.scanBarcode).toBe(true);
      expect(camera.props.showFrame).toBe(true);
      expect(camera.props.laserColor).toBeDefined();
      expect(camera.props.frameColor).toBe('white');
      expect(camera.props.onReadCode).toBeDefined();
    });
  });

  describe('Multiple Scooter Codes', () => {
    it('handles different scooter code formats', () => {
      const testCodes = [
        'SCOOTER-123',
        'SC-456',
        '789',
        'QR-CODE-ABC',
        'https://sparkapp.com/scooter/xyz',
      ];

      testCodes.forEach((code) => {
        jest.clearAllMocks();
        
        const { UNSAFE_getByType: getByType } = render(
          <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
        );

        const cam = getByType('Camera');
        act(() => {
          cam.props.onReadCode({
            nativeEvent: { codeStringValue: code },
          });
        });

        expect(mockOnScanSuccess).toHaveBeenCalledWith(code);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles onReadCode with missing nativeEvent', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');

      // Should not crash
      expect(() => {
        camera.props.onReadCode({});
      }).not.toThrow();

      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('handles onReadCode with undefined event', () => {
      const { UNSAFE_getByType } = render(
        <ScanScreen onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />,
      );

      const camera = UNSAFE_getByType('Camera');

      // Should not crash
      expect(() => {
        camera.props.onReadCode(undefined);
      }).not.toThrow();
    });
  });
});
