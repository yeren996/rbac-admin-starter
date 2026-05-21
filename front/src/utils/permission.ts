import { useAccessStore } from '@vben/stores';

export function hasPermission(code: string): boolean {
  const accessStore = useAccessStore();
  return accessStore.accessCodes.includes(code);
}

export function hasAnyPermission(codes: string[]): boolean {
  return codes.some((code) => hasPermission(code));
}

export function hasAllPermissions(codes: string[]): boolean {
  return codes.every((code) => hasPermission(code));
}
