import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuth } from '../../../auth';

jest.mock('../../../auth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockNavigate = jest.fn();

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for useAuth
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      logout: jest.fn(),
      isReady: true,
      isAuthenticated: true,
      isAuthorizing: false,
      token: 'fake-token',
      login: jest.fn(),
      authenticateWithToken: jest.fn(),
    });
  });

  it('renders user profile information', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    expect(getByText('testuser')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('renders menu buttons', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    expect(getByText('Mina resor')).toBeTruthy();
    expect(getByText('Mitt konto')).toBeTruthy();
    expect(getByText('Mitt saldo')).toBeTruthy();
    expect(getByText('Logga ut')).toBeTruthy();
  });

  it('navigates to trip history when tapping Mina resor', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Mina resor'));
    expect(mockNavigate).toHaveBeenCalledWith('TripHistory');
  });

  it('navigates to account screen when tapping Mitt konto', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Mitt konto'));
    expect(mockNavigate).toHaveBeenCalledWith('Account');
  });

  it('navigates to balance screen when tapping Mitt saldo', () => {
    const { getByText } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Mitt saldo'));
    expect(mockNavigate).toHaveBeenCalledWith('Balance');
  });
});
