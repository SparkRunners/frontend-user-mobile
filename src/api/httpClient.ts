import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { runtimeConfig } from '../config';

let accessToken: string | null = null;

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
    throw new Error('缺少 baseURL，无法创建 Axios 实例');
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
