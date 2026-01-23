export interface OidcUser {
  id?: string;
  username?: string;
  email?: string;
  emailVerified?: boolean;

  attributes?: {
    pwdEndTime?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
