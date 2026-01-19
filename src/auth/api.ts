import { isAxiosError } from 'axios';
import { authApiClient } from '../api/httpClient';

export interface EmailLoginPayload {
  email: string;
  password: string;
}

export interface EmailLoginResponse {
  token: string;
}

export interface EmailRegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: string[];
}

export interface EmailRegisterResponse {
  id: string;
  username: string;
  email: string;
  role?: string[];
}

const normalizeApiError = (error: unknown): Error => {
  if (isAxiosError(error)) {
    const message =
      (error.response?.data as { error?: string } | undefined)?.error ??
      error.message;
    return new Error(message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Något gick fel, försök igen');
};

export const loginWithEmail = async (
  payload: EmailLoginPayload,
): Promise<EmailLoginResponse> => {
  try {
    const response = await authApiClient.post<EmailLoginResponse>(
      '/auth/login',
      payload,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const registerWithEmail = async (
  payload: EmailRegisterPayload,
): Promise<EmailRegisterResponse> => {
  try {
    const response = await authApiClient.post<EmailRegisterResponse>(
      '/auth/register',
      payload,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};
