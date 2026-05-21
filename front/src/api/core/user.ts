import type { UserInfo } from '@vben/types';

import { getAuthSessionApi } from './session';

export async function getUserInfoApi() {
  const data = await getAuthSessionApi();
  return {
    avatar: data.user.avatar || '',
    desc: '',
    homePath: '/dashboard',
    realName: data.user.nickname,
    roles: data.roles,
    token: '',
    userId: data.user.id,
    username: data.user.username,
  } as UserInfo;
}
