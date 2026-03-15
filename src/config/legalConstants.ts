export const LEGAL_CONSTANTS = {
  COPYRIGHT_YEAR: new Date().getFullYear(),
  COPYRIGHT_HOLDER: 'GHETTO FINANCE',

  TERMS_OF_SERVICE: {
    VERSION: '1.0',
    LAST_UPDATED: 'March 2026',
    EFFECTIVE_DATE: 'March 15, 2026',
  },

  PRIVACY_POLICY: {
    VERSION: '1.0',
    LAST_UPDATED: 'March 2026',
    EFFECTIVE_DATE: 'March 15, 2026',
  },

  DOCUMENTATION: {
    VERSION: '1.0',
    LAST_UPDATED: 'March 2026',
  },

  SECURITY_AUDIT: {
    REVIEW_DATE: 'March 2026',
    SOLIDITY_VERSION: '0.8.19–0.8.20',
    OPENZEPPELIN_VERSION: '5.x',
  },

  DISPUTE_RESOLUTION: {
    ARBITRATION_TIMEFRAME_DAYS: 90,
    MEDIATION_TIMEFRAME_DAYS: 30,
  },

  FEES: {
    PLATFORM_FEE_PERCENTAGE: 2.5,
    TRANSACTION_FEE_PERCENTAGE: 1.0,
  },

  SUPPORT_EMAIL: 'support@ghetto.finance',
  LEGAL_EMAIL: 'legal@ghetto.finance',
} as const;

export const getCopyrightNotice = () =>
  `© ${LEGAL_CONSTANTS.COPYRIGHT_YEAR} ${LEGAL_CONSTANTS.COPYRIGHT_HOLDER}. All rights reserved.`;

export const getTermsVersion = () =>
  `Terms of Service v${LEGAL_CONSTANTS.TERMS_OF_SERVICE.VERSION}`;

export const getLastUpdated = () =>
  `Last Updated: ${LEGAL_CONSTANTS.TERMS_OF_SERVICE.LAST_UPDATED}`;
