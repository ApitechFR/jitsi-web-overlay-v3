export interface DecodedJwt {
  nom?: string;
  lastName?: string;
  prenom?: string;
  firstName?: string;
  email?: string;
  isAdmin?: boolean;
  admin?: boolean;
  [key: string]: unknown;
}

export function decodeJwt(token: string): DecodedJwt {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    // Optionally, log error here
    return {};
  }
}
