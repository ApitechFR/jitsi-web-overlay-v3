export interface UserInfos {
    uid?: string;
    email?: string;
    nom?: string; lastName?: string; family_name?: string;
    prenom?: string; firstName?: string; given_name?: string;
    isAdmin?: boolean; admin?: boolean;
    roles?: string[]; realm_access?: { roles?: string[] };
    idToken?: string; clientId?: string;
    [key: string]: unknown;
}
