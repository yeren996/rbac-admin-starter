import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '#/api/request';

import { getAuthSessionApi } from './session';

export namespace AuthApi {
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    user: {
      avatar: null | string;
      id: string;
      isSuperAdmin: boolean;
      nickname: string;
      username: string;
    };
  }

  export interface RefreshTokenResult {
    accessToken: string;
    expiresIn: number;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

export async function refreshTokenApi() {
  const accessStore = useAccessStore();
  const response = await baseRequestClient.post<any>('/auth/refresh', {
    refreshToken: accessStore.refreshToken,
  });
  return (response?.data?.data ?? response?.data) as AuthApi.RefreshTokenResult;
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function getAccessCodesApi() {
  const session = await getAuthSessionApi();
  return session.permissions;
}
