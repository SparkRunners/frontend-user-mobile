import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { runtimeConfig } from '../config';

let accessToken: string | null = null;

type UnauthorizedHandler = (error?: unknown) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const registerUnauthorizedHandler = (
  handler: UnauthorizedHandler | null,
) => {
  unauthorizedHandler = handler;
};

export const authTokenStore = {
  set(token: string | null) {
    accessToken = token;
  },
  get() {
    return accessToken;
  },
};

const createHttpClient = (
  baseURL: string,
  timeoutMs = 15_000,
): AxiosInstance => {
  if (!baseURL) {
    throw new Error('Missing baseURL. Unable to create Axios instance');
  }

  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
  });

  instance.interceptors.request.use(async (config: AxiosRequestConfig) => {
    const token = authTokenStore.get();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: config.headers?.Authorization ?? `Bearer ${token}`,
      };
    }
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error?.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler(error);
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export const scooterApiClient = createHttpClient(
  runtimeConfig.services.scooterApi.baseUrl,
  runtimeConfig.services.scooterApi.timeoutMs,
);

export const authApiClient = createHttpClient(
  runtimeConfig.services.authApi.baseUrl,
  runtimeConfig.services.authApi.timeoutMs,
);
