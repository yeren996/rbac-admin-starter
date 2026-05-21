import type { RouteRecordStringComponent } from '@vben/types';

import type { AuthApi } from './core/auth';

export const isDemoMode = import.meta.env.VITE_DEMO === 'true';

type Status = 'DISABLED' | 'ENABLED';

interface RoleRow {
  code: string;
  description?: string;
  id: string;
  isSystem: boolean;
  name: string;
  sort: number;
  status: Status;
}

interface UserRow {
  email?: string;
  id: string;
  isSuperAdmin: boolean;
  nickname: string;
  phone?: string;
  status: Status;
  userRoles?: { role: RoleRow }[];
  username: string;
}

interface MenuRow {
  children?: MenuRow[];
  component?: string;
  hidden: boolean;
  icon?: string;
  id: string;
  keepAlive: boolean;
  name?: string;
  parentId?: null | string;
  path?: string;
  permission?: string;
  redirect?: string;
  sort: number;
  status: Status;
  title: string;
  type: 'BUTTON' | 'DIRECTORY' | 'MENU';
}

interface AuditLogRow {
  action: string;
  actorUsername?: string;
  createdAt: string;
  durationMs?: number;
  id: string;
  method: string;
  module: string;
  path: string;
  responseStatus?: number;
}

interface NotificationRow {
  avatar: string;
  date: string;
  detail?: Record<string, unknown>;
  id: string;
  isRead: boolean;
  message: string;
  source: 'audit' | 'security' | 'system';
  title: string;
}

const clone = <T>(data: T): T => structuredClone(data);
const now = () => new Date().toISOString();
const pageOf = <T>(items: T[], params?: Record<string, any>) => {
  const page = Number(params?.page ?? 1) || 1;
  const pageSize = Number(params?.pageSize ?? 20) || 20;
  const start = (page - 1) * pageSize;
  return {
    items: clone(items.slice(start, start + pageSize)),
    page,
    pageSize,
    total: items.length,
  };
};
let idSeed = 1000;
const nextId = (prefix: string) => `${prefix}-${idSeed++}`;

const superAdminRole: RoleRow = {
  code: 'super_admin',
  id: 'role-super-admin',
  isSystem: true,
  name: '超级管理员',
  sort: 1,
  status: 'ENABLED',
};

const adminRole: RoleRow = {
  code: 'admin',
  id: 'role-admin',
  isSystem: true,
  name: '管理员',
  sort: 2,
  status: 'ENABLED',
};

const userRole: RoleRow = {
  code: 'user',
  id: 'role-user',
  isSystem: true,
  name: '普通用户',
  sort: 3,
  status: 'ENABLED',
};

const roles: RoleRow[] = [superAdminRole, adminRole, userRole];

const adminUser: UserRow = {
  email: 'admin@example.com',
  id: 'user-admin',
  isSuperAdmin: true,
  nickname: '超级管理员',
  phone: '13800000000',
  status: 'ENABLED',
  username: 'admin',
  userRoles: [{ role: superAdminRole }],
};

const demoUser: UserRow = {
  email: 'demo@example.com',
  id: 'user-demo',
  isSuperAdmin: false,
  nickname: '演示用户',
  phone: '13900000000',
  status: 'ENABLED',
  username: 'demo',
  userRoles: [{ role: userRole }],
};

const users: UserRow[] = [adminUser, demoUser];

const menuTree: MenuRow[] = [
  {
    component: '/dashboard/overview/index',
    hidden: false,
    icon: 'lucide:layout-dashboard',
    id: 'menu-dashboard',
    keepAlive: true,
    name: 'Dashboard',
    path: '/dashboard',
    permission: 'dashboard:overview',
    sort: 1,
    status: 'ENABLED',
    title: 'Dashboard',
    type: 'MENU',
  },
  {
    component: '/notification/list/index',
    hidden: false,
    icon: 'carbon:notification',
    id: 'menu-notification-list',
    keepAlive: true,
    name: 'NotificationList',
    path: '/notifications',
    permission: 'notification:list',
    sort: 2,
    status: 'ENABLED',
    title: '通知列表',
    type: 'MENU',
  },
  {
    children: [
      {
        component: '/system/user/index',
        hidden: false,
        icon: 'carbon:user-role',
        id: 'menu-system-user',
        keepAlive: false,
        name: 'SystemUser',
        parentId: 'menu-system',
        path: '/system/user',
        permission: 'system:user:list',
        sort: 1,
        status: 'ENABLED',
        title: '用户管理',
        type: 'MENU',
      },
      {
        component: '/system/role/index',
        hidden: false,
        icon: 'carbon:user-multiple',
        id: 'menu-system-role',
        keepAlive: false,
        name: 'SystemRole',
        parentId: 'menu-system',
        path: '/system/role',
        permission: 'system:role:list',
        sort: 2,
        status: 'ENABLED',
        title: '角色管理',
        type: 'MENU',
      },
      {
        component: '/system/menu/index',
        hidden: false,
        icon: 'carbon:menu',
        id: 'menu-system-menu',
        keepAlive: false,
        name: 'SystemMenu',
        parentId: 'menu-system',
        path: '/system/menu',
        permission: 'system:menu:list',
        sort: 3,
        status: 'ENABLED',
        title: '菜单管理',
        type: 'MENU',
      },
      {
        component: '/system/notification/index',
        hidden: false,
        icon: 'carbon:notification',
        id: 'menu-system-notification',
        keepAlive: false,
        name: 'SystemNotification',
        parentId: 'menu-system',
        path: '/system/notification',
        permission: 'system:notification:list',
        sort: 4,
        status: 'ENABLED',
        title: '通知管理',
        type: 'MENU',
      },
    ],
    hidden: false,
    icon: 'carbon:settings',
    id: 'menu-system',
    keepAlive: false,
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    sort: 100,
    status: 'ENABLED',
    title: '系统管理',
    type: 'DIRECTORY',
  },
  {
    children: [
      {
        component: '/system/audit-log/index',
        hidden: false,
        icon: 'carbon:document-audit',
        id: 'menu-audit-log',
        keepAlive: false,
        name: 'SystemAuditLog',
        parentId: 'menu-audit',
        path: '/system/audit-log',
        permission: 'system:audit:list',
        sort: 1,
        status: 'ENABLED',
        title: '操作日志',
        type: 'MENU',
      },
    ],
    hidden: false,
    icon: 'carbon:activity',
    id: 'menu-audit',
    keepAlive: false,
    name: 'SystemAudit',
    path: '/system-audit',
    redirect: '/system/audit-log',
    sort: 200,
    status: 'ENABLED',
    title: '系统审计',
    type: 'DIRECTORY',
  },
  {
    component: '/_core/profile/index',
    hidden: false,
    icon: 'carbon:user-profile',
    id: 'menu-profile',
    keepAlive: false,
    name: 'Profile',
    path: '/profile',
    permission: 'profile:view',
    sort: 900,
    status: 'ENABLED',
    title: '个人中心',
    type: 'MENU',
  },
];

const permissions = [
  'dashboard:overview',
  'notification:list',
  'profile:view',
  'system:user:list',
  'system:user:create',
  'system:user:update',
  'system:user:delete',
  'system:user:reset-password',
  'system:user:assign-role',
  'system:role:list',
  'system:role:create',
  'system:role:update',
  'system:role:delete',
  'system:role:assign-menu',
  'system:menu:list',
  'system:menu:create',
  'system:menu:update',
  'system:menu:delete',
  'system:notification:list',
  'system:notification:update',
  'system:notification:delete',
  'system:audit:list',
];

const auditLogs: AuditLogRow[] = [
  {
    action: 'login',
    actorUsername: 'admin',
    createdAt: now(),
    durationMs: 32,
    id: 'audit-1',
    method: 'POST',
    module: 'auth',
    path: '/api/auth/login',
    responseStatus: 200,
  },
  {
    action: 'list',
    actorUsername: 'admin',
    createdAt: now(),
    durationMs: 18,
    id: 'audit-2',
    method: 'GET',
    module: 'users',
    path: '/api/system/users',
    responseStatus: 200,
  },
];

const notifications: NotificationRow[] = [
  {
    avatar: 'svg:avatar-1',
    date: now(),
    detail: { path: '/api/auth/login' },
    id: 'notice-1',
    isRead: false,
    message: 'GitHub Pages 静态演示模式已启用，数据为浏览器内 mock。',
    source: 'system',
    title: '演示模式',
  },
  {
    avatar: 'svg:avatar-2',
    date: now(),
    detail: { path: '/api/system/users' },
    id: 'notice-2',
    isRead: true,
    message: '无部门分支保留用户、角色、菜单、通知与审计能力。',
    source: 'audit',
    title: '功能说明',
  },
];

function currentUser() {
  const username =
    globalThis.localStorage?.getItem('rbac-demo-user') || 'admin';
  return users.find((item) => item.username === username) ?? adminUser;
}

function toRoute(menu: MenuRow): RouteRecordStringComponent {
  return {
    children: menu.children?.map((child) => toRoute(child)),
    component: menu.component,
    meta: {
      hideInMenu: menu.hidden,
      icon: menu.icon,
      keepAlive: menu.keepAlive,
      order: menu.sort,
      title: menu.title,
    },
    name: menu.name,
    path: menu.path,
    redirect: menu.redirect,
  } as RouteRecordStringComponent;
}

export async function demoLogin(data: AuthApi.LoginParams) {
  const username = data.username === 'demo' ? 'demo' : 'admin';
  globalThis.localStorage?.setItem('rbac-demo-user', username);
  const user = currentUser();
  return {
    accessToken: `demo-access-token-${username}`,
    expiresIn: 7200,
    refreshToken: `demo-refresh-token-${username}`,
    user: {
      avatar: null,
      id: user.id,
      isSuperAdmin: user.isSuperAdmin,
      nickname: user.nickname,
      username: user.username,
    },
  } satisfies AuthApi.LoginResult;
}

export async function demoRefreshToken() {
  return { accessToken: 'demo-access-token-refreshed', expiresIn: 7200 };
}

export async function demoLogout() {
  return { success: true };
}

export async function demoAuthSession() {
  const user = currentUser();
  return {
    menus: clone(menuTree.map((menu) => toRoute(menu))),
    permissions: clone(permissions),
    roles: user.userRoles?.map((item) => item.role.code) ?? ['admin'],
    user: {
      avatar: null,
      id: user.id,
      isSuperAdmin: user.isSuperAdmin,
      nickname: user.nickname,
      username: user.username,
    },
  };
}

export async function demoDashboardOverview() {
  return {
    menuCount: flattenMenus(menuTree).filter((item) => item.type !== 'BUTTON')
      .length,
    recentLogs: clone(auditLogs.slice(0, 8)),
    roleCount: roles.length,
    userCount: users.length,
  };
}

export async function demoGetUsers(params?: Record<string, any>) {
  let items = users;
  if (params?.username) {
    items = items.filter((item) => item.username.includes(params.username));
  }
  if (params?.nickname) {
    items = items.filter((item) => item.nickname.includes(params.nickname));
  }
  if (params?.status) {
    items = items.filter((item) => item.status === params.status);
  }
  return pageOf(items, params);
}

export async function demoCreateUser(data: Record<string, any>) {
  const roleIds = (data.roleIds || ['role-user']) as string[];
  const user: UserRow = {
    email: data.email,
    id: nextId('user'),
    isSuperAdmin: false,
    nickname: data.nickname || data.username,
    phone: data.phone,
    status: 'ENABLED',
    username: data.username || nextId('demo'),
    userRoles: roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => ({ role })),
  };
  users.unshift(user);
  return clone(user);
}

export async function demoUpdateUser(id: string, data: Record<string, any>) {
  const user = users.find((item) => item.id === id);
  if (user) {
    Object.assign(user, {
      email: data.email,
      nickname: data.nickname ?? user.nickname,
      phone: data.phone,
    });
  }
  return clone(user ?? users[0]);
}

export async function demoDeleteUser(id: string) {
  const index = users.findIndex((item) => item.id === id && !item.isSuperAdmin);
  if (index !== -1) users.splice(index, 1);
  return { success: true };
}

export async function demoUpdateUserStatus(id: string, status: string) {
  const user = users.find((item) => item.id === id);
  if (user && !user.isSuperAdmin) user.status = status as Status;
  return clone(user ?? users[0]);
}

export async function demoResetUserPassword() {
  return { success: true };
}

export async function demoAssignUserRoles(id: string, roleIds: string[]) {
  const user = users.find((item) => item.id === id);
  if (user) {
    user.userRoles = roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => ({ role }));
  }
  return { success: true };
}

export async function demoGetRoles(params?: Record<string, any>) {
  return pageOf(roles, params);
}

export async function demoCreateRole(data: Record<string, any>) {
  const role: RoleRow = {
    code: data.code || nextId('role'),
    description: data.description,
    id: nextId('role'),
    isSystem: false,
    name: data.name || '自定义角色',
    sort: Number(data.sort ?? roles.length + 1),
    status: data.status || 'ENABLED',
  };
  roles.push(role);
  return clone(role);
}

export async function demoUpdateRole(id: string, data: Record<string, any>) {
  const role = roles.find((item) => item.id === id);
  if (role && !role.isSystem) Object.assign(role, data);
  return clone(role ?? roles[0]);
}

export async function demoDeleteRole(id: string) {
  const index = roles.findIndex((item) => item.id === id && !item.isSystem);
  if (index !== -1) roles.splice(index, 1);
  return { success: true };
}

export async function demoUpdateRoleStatus(id: string, status: string) {
  const role = roles.find((item) => item.id === id);
  if (role && !role.isSystem) role.status = status as Status;
  return clone(role ?? roles[0]);
}

export async function demoGetRoleMenus() {
  return flattenMenus(menuTree).map((item) => item.id);
}

export async function demoAssignRoleMenus() {
  return { success: true };
}

export async function demoGetMenus() {
  return clone(menuTree);
}

export async function demoCreateMenu(data: Record<string, any>) {
  const menu: MenuRow = {
    hidden: Boolean(data.hidden),
    id: nextId('menu'),
    keepAlive: Boolean(data.keepAlive),
    name: data.name,
    parentId: data.parentId,
    path: data.path,
    permission: data.permission,
    sort: Number(data.sort ?? 1),
    status: data.status || 'ENABLED',
    title: data.title || '演示菜单',
    type: data.type || 'MENU',
  };
  menuTree.push(menu);
  return clone(menu);
}

export async function demoUpdateMenu(id: string, data: Record<string, any>) {
  const menu = flattenMenus(menuTree).find((item) => item.id === id);
  if (menu) Object.assign(menu, data);
  return clone(menu ?? menuTree[0]);
}

export async function demoDeleteMenu(id: string) {
  removeMenu(menuTree, id);
  return { success: true };
}

export async function demoUpdateMenuStatus(id: string, status: string) {
  const menu = flattenMenus(menuTree).find((item) => item.id === id);
  if (menu) menu.status = status as Status;
  return clone(menu ?? menuTree[0]);
}

export async function demoGetAuditLogs(params?: Record<string, any>) {
  return pageOf(auditLogs, params);
}

export async function demoGetNotifications() {
  return clone(notifications);
}

export async function demoGetNotificationDetail(
  id: string,
): Promise<NotificationRow> {
  const emptyNotification: NotificationRow = {
    avatar: 'svg:avatar-1',
    date: now(),
    id: 'notice-empty',
    isRead: true,
    message: '暂无通知详情',
    source: 'system',
    title: '通知',
  };
  return clone(
    notifications.find((item) => item.id === id) ?? emptyNotification,
  );
}

export async function demoUnreadNotificationCount() {
  return { count: notifications.filter((item) => !item.isRead).length };
}

export async function demoMarkNotificationRead(id: string) {
  const notification = notifications.find((item) => item.id === id);
  if (notification) notification.isRead = true;
  return { success: true };
}

export async function demoMarkAllNotificationsRead() {
  notifications.forEach((item) => (item.isRead = true));
  return { success: true };
}

export async function demoRemoveNotification(id: string) {
  const index = notifications.findIndex((item) => item.id === id);
  if (index !== -1) notifications.splice(index, 1);
  return { success: true };
}

export async function demoClearNotifications() {
  notifications.length = 0;
  return { success: true };
}

export async function demoGetNotificationPage(params?: Record<string, any>) {
  return pageOf(notifications, params);
}

export async function demoUpdateProfile(data: Record<string, any>) {
  const user = currentUser();
  user.nickname = data.nickname ?? user.nickname;
  user.email = data.email ?? user.email;
  user.phone = data.phone ?? user.phone;
  return clone(user);
}

export async function demoChangePassword() {
  return { success: true };
}

function flattenMenus(items: MenuRow[]): MenuRow[] {
  return items.flatMap((item) => [item, ...flattenMenus(item.children ?? [])]);
}

function removeMenu(items: MenuRow[], id: string): boolean {
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items.splice(index, 1);
    return true;
  }
  return items.some((item) => removeMenu(item.children ?? [], id));
}
