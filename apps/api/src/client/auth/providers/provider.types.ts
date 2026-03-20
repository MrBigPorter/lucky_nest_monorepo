export type OauthProvider = 'google' | 'facebook' | 'apple';

export interface VerifiedOauthProfile {
  providerUserId: string;
  email?: string | null;
  nickname?: string | null;
  avatar?: string | null;
}
