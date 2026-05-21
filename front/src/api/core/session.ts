import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

interface AuthSessionResult {
  menus: RouteRecordStringComponent[];
  permissions: string[];
  roles: string[];
  user: {
    avatar: null | string;
    id: string;
    isSuperAdmin: boolean;
    nickname: string;
    username: string;
  };
}

let authSessionPromise: null | Promise<AuthSessionResult> = null;

/**
 * 登录态首屏需要用户、按钮权限和动态菜单。
 * 复用 /auth/me 的聚合响应，避免登录或刷新时并发重复请求 /auth/me、/auth/codes、/auth/menus。
 */
export function getAuthSessionApi() {
  authSessionPromise ??= requestClient
    .get<AuthSessionResult>('/auth/me')
    .catch((error) => {
      authSessionPromise = null;
      throw error;
    });
  return authSessionPromise;
}

export function clearAuthSessionCache() {
  authSessionPromise = null;
}
