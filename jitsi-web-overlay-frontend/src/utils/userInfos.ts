import { decodeJwt } from './decodeJwt';
export interface UserInfos {
  email?: string;
  nom?: string;
  lastName?: string;
  family_name?: string;
  prenom?: string;
  firstName?: string;
  given_name?: string;
  isAdmin?: boolean;
  admin?: boolean;
  [key: string]: unknown;
}

export async function fetchUserInfos(): Promise<UserInfos | null> {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/userinfo`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.idToken && typeof data.idToken === 'string') {
      try {
        return decodeJwt(data.idToken);
      } catch {
        
        return data;
      }
    }
    return data;
  } catch {
    return null;
  }
}

export function getFirstStringProp(obj: Record<string, unknown>, props: string[]): string {
  for (const key of props) {
    if (typeof obj[key] === 'string') {
      return obj[key] as string;
    }
  }
  return '';
}

export function isUserAdmin(userInfos: UserInfos | null): boolean {
  return Boolean(userInfos && (userInfos.isAdmin || userInfos.admin));
}

export function getUserName(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  return getFirstStringProp(userInfos, [
    'nom', 'lastName', 'family_name', 'prenom', 'firstName', 'given_name',
  ]);
}

export function getUserEmail(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  return getFirstStringProp(userInfos, ['email']);
}

export function getUserFullName(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  const firstName = getFirstStringProp(userInfos, [
    'prenom', 'firstName', 'given_name',
  ]);
  const lastName = getFirstStringProp(userInfos, [
    'nom', 'lastName', 'family_name',
  ]);
  return `${firstName} ${lastName}`.trim();
}

export function getUserInitials(userInfos: UserInfos | null): string {
  if (!userInfos) return '';
  const firstName = getFirstStringProp(userInfos, [
    'prenom', 'firstName', 'given_name',
  ]);
  const lastName = getFirstStringProp(userInfos, [
    'nom', 'lastName', 'family_name',
  ]);
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function isUserAuthenticated(userInfos: UserInfos | null): boolean {
  return Boolean(userInfos);
}

export function getUserRole(userInfos: UserInfos | null): string {
  if (!userInfos) return 'guest';
  return userInfos.isAdmin || userInfos.admin ? 'admin' : 'user';
}
