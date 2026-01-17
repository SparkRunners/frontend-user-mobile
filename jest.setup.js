/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockScreen = React.forwardRef((props, ref) => React.createElement(View, { ref, ...props }, props.children));
  const MockScreenContainer = ({ children }) => React.createElement(View, null, children);
  return {
    enableScreens: jest.fn(),
    Screen: MockScreen,
    ScreenContainer: MockScreenContainer,
  };
});

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: {
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  },
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => {
  const React = require('react');
  const Toast = () => React.createElement('View', null);
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return {
    __esModule: true,
    default: Toast,
    show: Toast.show,
    hide: Toast.hide,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const SafeAreaInsetsContext = React.createContext(inset);
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) => React.createElement('View', props, children),
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaInsetsContext,
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
  };
});



// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
    }));
    return React.createElement(View, { ...props }, props.children);
  });
  const MockMarker = (props) => React.createElement(View, { ...props }, props.children);
  const MockPolygon = (props) => React.createElement(View, { ...props }, props.children);
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polygon: MockPolygon,
    PROVIDER_DEFAULT: 'default',
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock react-native-camera-kit
jest.mock('react-native-camera-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraScreen: (props) => React.createElement(View, { ...props, testID: 'camera-screen' }),
  };
});

// Mock @react-native-community/geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
}));
