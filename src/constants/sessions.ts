export const MAX_WEIGHT = 255

export enum SignerLevel {
  RECOVERY = MAX_WEIGHT,
  GOLD = 3,
  SILVER = 2,
  BRONZE = 1
}

export const DEFAULT_THRESHOLD = SignerLevel.GOLD + SignerLevel.SILVER
