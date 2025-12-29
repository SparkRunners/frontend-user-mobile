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
    });

    const { getByText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    expect(getByText('Preparing your session...')).toBeTruthy();
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

  it('renders login form by default when unauthenticated', () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    // Switch to Email tab first
    fireEvent.press(getByText('E-post'));

    // "Logga in" appears in the tab switcher and the submit button
    expect(getAllByText('Logga in').length).toBeGreaterThan(0);
    expect(getByPlaceholderText('din@epost.se')).toBeTruthy();
    expect(getByPlaceholderText('Minst 8 tecken')).toBeTruthy();
  });

  it('validates email login form', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    fireEvent.press(getByText('E-post'));

    const emailInput = getByPlaceholderText('din@epost.se');
    const passwordInput = getByPlaceholderText('Minst 8 tecken');
    // Use the button specifically, or just the text if we are careful
    // The button text is "Logga in"
    const submitButtons = getAllByText('Logga in');
    const submitButton = submitButtons[submitButtons.length - 1]; // Usually the last one is the button

    // Fill in invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(passwordInput, '12345678');
    
    // Fill in valid email
    fireEvent.changeText(emailInput, 'test@example.com');
    
    // Submit
    mockLoginWithEmail.mockResolvedValueOnce({ token: 'fake-token' });
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLoginWithEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '12345678',
      });
      expect(mockAuthenticateWithToken).toHaveBeenCalledWith('fake-token');
    });
  });

  it('handles registration flow', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <AuthGate>
        <></>
      </AuthGate>
    );

    fireEvent.press(getByText('E-post'));
    fireEvent.press(getByText('Skapa konto'));

    const usernameInput = getByPlaceholderText('Spark Rider');
    const emailInput = getByPlaceholderText('din@epost.se');
    const passwordInput = getByPlaceholderText('Minst 8 tecken');
    const confirmInput = getByPlaceholderText('Upprepa lösenordet');
    
    // "Skapa konto" is in the tab and the button
    const submitButtons = getAllByText('Skapa konto');
    const submitButton = submitButtons[submitButtons.length - 1];

    fireEvent.changeText(usernameInput, 'newuser');
    fireEvent.changeText(emailInput, 'new@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    mockRegisterWithEmail.mockResolvedValueOnce({ id: '1', username: 'newuser', email: 'new@example.com' });
    mockLoginWithEmail.mockResolvedValueOnce({ token: 'new-token' });

    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockRegisterWithEmail).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(mockLoginWithEmail).toHaveBeenCalled();
      expect(mockAuthenticateWithToken).toHaveBeenCalledWith('new-token');
    });
  });
});
