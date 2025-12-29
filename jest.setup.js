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
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaConsumer: jest.fn(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
  };
});


