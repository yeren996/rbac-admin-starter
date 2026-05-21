import {
  demoAssignRoleMenus,
  demoAssignUserRoles,
  demoChangePassword,
  demoClearNotifications,
  demoCreateMenu,
  demoCreateRole,
  demoCreateUser,
  demoDashboardOverview,
  demoDeleteMenu,
  demoDeleteRole,
  demoDeleteUser,
  demoGetAuditLogs,
  demoGetMenus,
  demoGetNotificationDetail,
  demoGetNotificationPage,
  demoGetNotifications,
  demoGetRoleMenus,
  demoGetRoles,
  demoGetUsers,
  demoMarkAllNotificationsRead,
  demoMarkNotificationRead,
  demoRemoveNotification,
  demoResetUserPassword,
  demoUnreadNotificationCount,
  demoUpdateMenu,
  demoUpdateMenuStatus,
  demoUpdateProfile,
  demoUpdateRole,
  demoUpdateRoleStatus,
  demoUpdateUser,
  demoUpdateUserStatus,
  isDemoMode,
} from '#/api/demo';
import { requestClient } from '#/api/request';

/**
 * RBAC 业务接口聚合。
 *
 * 这里集中维护后台页面直接使用的类型与请求函数：
 * - 组件只依赖本文件暴露的稳定类型，不直接拼接后端 URL；
 * - 后端响应经过 requestClient 的统一拦截器解包，函数返回值即业务 data；
 * - 后续若接口路径变更，只需要在本文件调整映射。
 */

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface RoleRow {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'DISABLED' | 'ENABLED';
  sort: number;
  isSystem: boolean;
}

export interface UserRow {
  id: string;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  status: 'DISABLED' | 'ENABLED';
  isSuperAdmin: boolean;
  userRoles?: { role: RoleRow }[];
}

export interface MenuRow {
  id: string;
  parentId?: null | string;
  type: 'BUTTON' | 'DIRECTORY' | 'MENU';
  title: string;
  name?: string;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  permission?: string;
  sort: number;
  hidden: boolean;
  keepAlive: boolean;
  status: 'DISABLED' | 'ENABLED';
  children?: MenuRow[];
}

export interface AuditLogRow {
  id: string;
  actorUsername?: string;
  action: string;
  module: string;
  method: string;
  path: string;
  requestBody?: unknown;
  responseStatus?: number;
  durationMs?: number;
  createdAt: string;
}

export interface NotificationRow {
  avatar: string;
  date: string;
  detail?: Record<string, unknown>;
  id: string;
  isRead: boolean;
  link?: string;
  message: string;
  query?: Record<string, string>;
  source: 'audit' | 'security' | 'system';
  title: string;
}

export function getDashboardOverviewApi() {
  if (isDemoMode) return demoDashboardOverview();
  return requestClient.get<{
    menuCount: number;
    recentLogs: AuditLogRow[];
    roleCount: number;
    userCount: number;
  }>('/dashboard/overview');
}

export function getUsersApi(params?: Record<string, any>) {
  if (isDemoMode) return demoGetUsers(params);
  return requestClient.get<PageResult<UserRow>>('/system/users', { params });
}
export function createUserApi(data: Record<string, any>) {
  if (isDemoMode) return demoCreateUser(data);
  return requestClient.post<UserRow>('/system/users', data);
}
export function updateUserApi(id: string, data: Record<string, any>) {
  if (isDemoMode) return demoUpdateUser(id, data);
  return requestClient.request<UserRow>(`/system/users/${id}`, {
    data,
    method: 'PATCH',
  });
}
export function deleteUserApi(id: string) {
  if (isDemoMode) return demoDeleteUser(id);
  return requestClient.delete(`/system/users/${id}`);
}
export function updateUserStatusApi(id: string, status: string) {
  if (isDemoMode) return demoUpdateUserStatus(id, status);
  return requestClient.request<UserRow>(`/system/users/${id}/status`, {
    data: { status },
    method: 'PATCH',
  });
}
export function resetUserPasswordApi(id: string, password: string) {
  if (isDemoMode) return demoResetUserPassword();
  return requestClient.post(`/system/users/${id}/reset-password`, { password });
}
export function assignUserRolesApi(id: string, roleIds: string[]) {
  if (isDemoMode) return demoAssignUserRoles(id, roleIds);
  return requestClient.post(`/system/users/${id}/roles`, { roleIds });
}

export function getRolesApi(params?: Record<string, any>) {
  if (isDemoMode) return demoGetRoles(params);
  return requestClient.get<PageResult<RoleRow>>('/system/roles', { params });
}
export function createRoleApi(data: Record<string, any>) {
  if (isDemoMode) return demoCreateRole(data);
  return requestClient.post<RoleRow>('/system/roles', data);
}
export function updateRoleApi(id: string, data: Record<string, any>) {
  if (isDemoMode) return demoUpdateRole(id, data);
  return requestClient.request<RoleRow>(`/system/roles/${id}`, {
    data,
    method: 'PATCH',
  });
}
export function deleteRoleApi(id: string) {
  if (isDemoMode) return demoDeleteRole(id);
  return requestClient.delete(`/system/roles/${id}`);
}
export function updateRoleStatusApi(id: string, status: string) {
  if (isDemoMode) return demoUpdateRoleStatus(id, status);
  return requestClient.request<RoleRow>(`/system/roles/${id}/status`, {
    data: { status },
    method: 'PATCH',
  });
}
export function getRoleMenusApi(id: string) {
  if (isDemoMode) return demoGetRoleMenus();
  return requestClient.get<string[]>(`/system/roles/${id}/menus`);
}
export function assignRoleMenusApi(id: string, menuIds: string[]) {
  if (isDemoMode) return demoAssignRoleMenus();
  return requestClient.post(`/system/roles/${id}/menus`, { menuIds });
}

export function getMenusApi() {
  if (isDemoMode) return demoGetMenus();
  return requestClient.get<MenuRow[]>('/system/menus/tree');
}
export function createMenuApi(data: Record<string, any>) {
  if (isDemoMode) return demoCreateMenu(data);
  return requestClient.post<MenuRow>('/system/menus', data);
}
export function updateMenuApi(id: string, data: Record<string, any>) {
  if (isDemoMode) return demoUpdateMenu(id, data);
  return requestClient.request<MenuRow>(`/system/menus/${id}`, {
    data,
    method: 'PATCH',
  });
}
export function deleteMenuApi(id: string) {
  if (isDemoMode) return demoDeleteMenu(id);
  return requestClient.delete(`/system/menus/${id}`);
}
export function updateMenuStatusApi(id: string, status: string) {
  if (isDemoMode) return demoUpdateMenuStatus(id, status);
  return requestClient.request<MenuRow>(`/system/menus/${id}/status`, {
    data: { status },
    method: 'PATCH',
  });
}

export function getAuditLogsApi(params?: Record<string, any>) {
  if (isDemoMode) return demoGetAuditLogs(params);
  return requestClient.get<PageResult<AuditLogRow>>('/system/audit-logs', {
    params,
  });
}

/** 顶部栏通知列表：后端只返回当前登录用户可见的通知。 */
export function getNotificationsApi() {
  if (isDemoMode) return demoGetNotifications();
  return requestClient.get<NotificationRow[]>('/notifications');
}

export function getNotificationDetailApi(id: string) {
  if (isDemoMode) return demoGetNotificationDetail(id);
  return requestClient.get<NotificationRow>(
    `/notifications/${encodeURIComponent(id)}`,
  );
}

export function getUnreadNotificationCountApi() {
  if (isDemoMode) return demoUnreadNotificationCount();
  return requestClient.get<{ count: number }>('/notifications/unread-count');
}

export function markNotificationReadApi(id: string) {
  if (isDemoMode) return demoMarkNotificationRead(id);
  return requestClient.request(
    `/notifications/${encodeURIComponent(id)}/read`,
    {
      method: 'PATCH',
    },
  );
}

export function markAllNotificationsReadApi() {
  if (isDemoMode) return demoMarkAllNotificationsRead();
  return requestClient.request('/notifications/read-all', {
    method: 'PATCH',
  });
}

export function removeNotificationApi(id: string) {
  if (isDemoMode) return demoRemoveNotification(id);
  return requestClient.delete(`/notifications/${encodeURIComponent(id)}`);
}

export function clearNotificationsApi() {
  if (isDemoMode) return demoClearNotifications();
  return requestClient.delete('/notifications');
}

/** 后台通知管理模块：仅给拥有 system:notification:* 权限的管理员使用。 */
export function getNotificationPageApi(params?: Record<string, any>) {
  if (isDemoMode) return demoGetNotificationPage(params);
  return requestClient.get<PageResult<NotificationRow>>(
    '/system/notifications',
    { params },
  );
}

export function getSystemNotificationDetailApi(id: string) {
  if (isDemoMode) return demoGetNotificationDetail(id);
  return requestClient.get<NotificationRow>(
    `/system/notifications/${encodeURIComponent(id)}`,
  );
}

export function markSystemNotificationReadApi(id: string) {
  if (isDemoMode) return demoMarkNotificationRead(id);
  return requestClient.request(
    `/system/notifications/${encodeURIComponent(id)}/read`,
    {
      method: 'PATCH',
    },
  );
}

export function markAllSystemNotificationsReadApi() {
  if (isDemoMode) return demoMarkAllNotificationsRead();
  return requestClient.request('/system/notifications/read-all', {
    method: 'PATCH',
  });
}

export function removeSystemNotificationApi(id: string) {
  if (isDemoMode) return demoRemoveNotification(id);
  return requestClient.delete(
    `/system/notifications/${encodeURIComponent(id)}`,
  );
}

export function clearSystemNotificationsApi() {
  if (isDemoMode) return demoClearNotifications();
  return requestClient.delete('/system/notifications');
}

export function updateProfileApi(data: Record<string, any>) {
  if (isDemoMode) return demoUpdateProfile(data);
  return requestClient.request('/profile', { data, method: 'PATCH' });
}
export function changePasswordApi(data: {
  newPassword: string;
  oldPassword: string;
}) {
  if (isDemoMode) return demoChangePassword();
  return requestClient.post('/profile/change-password', data);
}
