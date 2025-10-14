
import { UserInfos } from '@/api';

export function getFirstStringProp(obj: Record<string, unknown>, props: string[]) {
  for (const key of props) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
}

export function isUserAdmin(userInfos: UserInfos | null): boolean {
  if (!userInfos) return false;
  if (userInfos.isAdmin || userInfos.admin) return true;

  const roles =
    userInfos.roles ??
    userInfos.realm_access?.roles ??
    ([] as string[]);

  const normalized = roles.map(r => r.toLowerCase());
  return normalized.includes('admin') || normalized.includes('role_admin');
}

export function getUserName(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  return getFirstStringProp(userInfos, [
    'nom',
    'lastName',
    'family_name',
    'prenom',
    'firstName',
    'given_name',
  ]);
}

export function getUserEmail(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  return getFirstStringProp(userInfos, ['email']);
}

export function getUserFullName(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  const firstName = getFirstStringProp(userInfos, ['prenom', 'firstName', 'given_name']);
  const lastName = getFirstStringProp(userInfos, ['nom', 'lastName', 'family_name']);
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function getUserInitials(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  const firstName = getFirstStringProp(userInfos, ['prenom', 'firstName', 'given_name']);
  const lastName = getFirstStringProp(userInfos, ['nom', 'lastName', 'family_name']);
  const a = firstName ? firstName.charAt(0) : '';
  const b = lastName ? lastName.charAt(0) : '';
  return (a + b).toUpperCase();
}

export function isUserAuthenticated(userInfos: UserInfos | null): boolean {
  return Boolean(userInfos);
}

export function getUserRole(userInfos: UserInfos | null): string {
  return isUserAdmin(userInfos) ? 'admin' : userInfos ? 'user' : 'guest';
}
