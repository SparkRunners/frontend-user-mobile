import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthGate } from '../AuthGate';
import * as api from '../api';
import * as AuthProvider from '../AuthProvider';

// Mock the API functions
jest.mock('../api');
// Mock the AuthProvider
jest.mock('../AuthProvider');

const mockLoginWithEmail = api.loginWithEmail as jest.Mock;
const mockRegisterWithEmail = api.registerWithEmail as jest.Mock;
const mockUseAuth = AuthProvider.useAuth as jest.Mock;

describe('AuthGate', () => {
  const mockAuthenticateWithToken = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useAuth
    mockUseAuth.mockReturnValue({
      isReady: true,
      isAuthenticated: false,
      isAuthorizing: false,
      user: null,
      login: mockLogin,
      logout: jest.fn(),
      authenticateWithToken: mockAuthenticateWithToken,
    });
  });

  it('renders loading state when not ready', () => {
    mockUseAuth.mockReturnValue({
      isReady: false,
      isAuthenticated: false,
      isAuthorizing: false,
    });

    const { UNSAFE_root } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    // Just verify it renders without crashing - loading shows ActivityIndicator
    expect(UNSAFE_root).toBeTruthy();
  });


  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      isAuthenticated: true,
      user: { id: '1', username: 'test' },
    });

    const { getByText } = render(
      <AuthGate>
        <Text>Protected Content</Text>
      </AuthGate>
    );

    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('renders welcome screen by default when unauthenticated', () => {
    const { getByText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    // Welcome screen shows these buttons
    expect(getByText('Log in')).toBeTruthy();
    expect(getByText('Create account')).toBeTruthy();
    expect(getByText('Explore the app')).toBeTruthy();
  });

  it('validates email login flow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    // Click Log in button on welcome screen
    fireEvent.press(getByText('Log in'));

    // Now on SignIn screen (English UI)
    const emailInput = getByPlaceholderText('E-mail');
    
    // Enter email and proceed
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(getByText('Next'));

    // Now on Password screen
    await waitFor(() => {
      expect(getByText('test@example.com')).toBeTruthy();
    });

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, '12345678');
    
    // Submit login
    mockLoginWithEmail.mockResolvedValueOnce({ token: 'fake-token' });
    fireEvent.press(getByText('Log in'));

    await waitFor(() => {
      expect(mockLoginWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '12345678',
      });
      expect(mockAuthenticateWithToken).toHaveBeenCalledWith('fake-token', { persist: true });
    });
  });

  it('handles registration flow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    // Click Create account on welcome screen
    fireEvent.press(getByText('Create account'));

    // Now on SignUp screen (English UI) - first step: email
    const emailInput = getByPlaceholderText('E-mail');
    fireEvent.changeText(emailInput, 'new@example.com');
    fireEvent.press(getByText('Next'));

    // Now on second step: details
    await waitFor(() => {
      expect(getByText('new@example.com')).toBeTruthy();
    });

    const usernameInput = getByPlaceholderText('Name (Required)');
    const passwordInput = getByPlaceholderText('Password (Required)');

    fireEvent.changeText(usernameInput, 'newuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Mock register and auto-login after registration
    mockRegisterWithEmail.mockResolvedValueOnce({ id: '1', username: 'newuser', email: 'new@example.com' });
    mockLoginWithEmail.mockResolvedValueOnce({ token: 'new-token' });

    fireEvent.press(getByText('Create account'));

    await waitFor(() => {
      expect(mockRegisterWithEmail).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
      // Auto-login happens after registration
      expect(mockLoginWithEmail).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(mockAuthenticateWithToken).toHaveBeenCalledWith('new-token', { persist: true });
    });
  });
});
