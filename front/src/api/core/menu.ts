import type { RouteRecordStringComponent } from '@vben/types';

import { getAuthSessionApi } from './session';

export async function getAllMenusApi() {
  const session = await getAuthSessionApi();
  return session.menus as RouteRecordStringComponent[];
}
