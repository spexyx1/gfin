export const PROHIBITED_CONTENT = {
  CATEGORIES: {
    DRUGS: {
      id: 'drugs',
      name: 'Illegal Drugs & Narcotics',
      description: 'All controlled substances, illegal drugs, drug paraphernalia, and substances marketed as legal alternatives to illegal drugs',
      icon: 'pill',
      severity: 'critical' as const,
    },
    WEAPONS: {
      id: 'weapons',
      name: 'Weapons & Explosives',
      description: 'Firearms, ammunition, explosives, and weapon accessories without proper licensing',
      icon: 'bomb',
      severity: 'critical' as const,
    },
    STOLEN: {
      id: 'stolen',
      name: 'Stolen Goods',
      description: 'Items obtained through theft, burglary, or other illegal means',
      icon: 'alert-triangle',
      severity: 'severe' as const,
    },
    ADULT: {
      id: 'adult',
      name: 'Adult Services & Content',
      description: 'Sexual services, escort services, and adult content',
      icon: 'user-x',
      severity: 'severe' as const,
    },
    HACKING: {
      id: 'hacking',
      name: 'Hacking Tools & Services',
      description: 'Hacking services, malware, stolen credentials, and unauthorized access tools',
      icon: 'skull',
      severity: 'critical' as const,
    },
    CRIME: {
      id: 'crime',
      name: 'Crime for Hire',
      description: 'Services offering to commit crimes including violence, fraud, or illegal activities',
      icon: 'user-minus',
      severity: 'critical' as const,
    },
    COUNTERFEIT: {
      id: 'counterfeit',
      name: 'Counterfeit Goods',
      description: 'Fake branded items, counterfeit currency, forged documents',
      icon: 'copy',
      severity: 'severe' as const,
    },
    TRAFFICKING: {
      id: 'trafficking',
      name: 'Human Trafficking',
      description: 'Any services related to human trafficking or exploitation',
      icon: 'users',
      severity: 'critical' as const,
    },
    ENDANGERED: {
      id: 'endangered',
      name: 'Endangered Species',
      description: 'Products made from endangered or protected animals and plants',
      icon: 'bird',
      severity: 'severe' as const,
    },
  },

  REWARD_TIERS: {
    LOW: { min: 5, max: 10, label: 'Minor Violation' },
    MEDIUM: { min: 25, max: 50, label: 'Moderate Violation' },
    HIGH: { min: 100, max: 250, label: 'Severe Violation' },
    CRITICAL: { min: 500, max: 1000, label: 'Critical Violation' },
  },

  REPUTATION_TIERS: {
    OBSERVER: {
      name: 'Observer',
      minReports: 0,
      minAccuracy: 0,
      icon: 'eye',
      color: 'gray',
      description: 'New community member learning the ropes',
    },
    GUARDIAN: {
      name: 'Guardian',
      minReports: 10,
      minAccuracy: 75,
      icon: 'shield',
      color: 'blue',
      description: 'Proven reporter with consistent accuracy',
    },
    SENTINEL: {
      name: 'Sentinel',
      minReports: 25,
      minAccuracy: 85,
      icon: 'shield-check',
      color: 'green',
      description: 'Trusted member with high accuracy',
    },
    PROTECTOR: {
      name: 'Protector',
      minReports: 50,
      minAccuracy: 90,
      icon: 'award',
      color: 'purple',
      description: 'Elite community protector with exceptional track record',
    },
    CHAMPION: {
      name: 'Champion',
      minReports: 100,
      minAccuracy: 95,
      icon: 'trophy',
      color: 'yellow',
      description: 'Legendary community champion, top tier moderator',
    },
  },

  SEVERITY_LEVELS: {
    LOW: {
      label: 'Low',
      color: 'yellow',
      description: 'Minor policy violation or spam',
    },
    MEDIUM: {
      label: 'Medium',
      color: 'orange',
      description: 'Prohibited content or TOS breach',
    },
    HIGH: {
      label: 'High',
      color: 'red',
      description: 'Illegal goods or severe policy violation',
    },
    CRITICAL: {
      label: 'Critical',
      color: 'red',
      description: 'Dangerous items or immediate harm potential',
    },
  },

  POLICY_STATEMENTS: {
    MAIN: 'GHETTO Finance is committed to maintaining a legal and ethical marketplace. All listings must comply with applicable laws and regulations.',
    ZERO_TOLERANCE: 'We have zero tolerance for illegal goods and services. Users who violate our policies will receive warnings and opportunities to remedy their actions. However, repeated violations within a short period or severe violations will result in account suspension or permanent ban, and potential legal consequences.',
    COMMUNITY_ROLE: 'Community moderation is essential to our platform. We reward users who help keep our marketplace safe and legal.',
    LEGAL_DISCLAIMER: 'Users are responsible for ensuring their listings comply with all local, state, federal, and international laws.',
  },

  REPORT_REASONS: [
    { value: 'prohibited_category', label: 'Prohibited Category', severity: 'high' },
    { value: 'illegal_content', label: 'Illegal Content', severity: 'critical' },
    { value: 'stolen_goods', label: 'Stolen Goods', severity: 'high' },
    { value: 'counterfeit', label: 'Counterfeit Item', severity: 'high' },
    { value: 'misleading_info', label: 'Misleading Information', severity: 'medium' },
    { value: 'spam', label: 'Spam', severity: 'low' },
    { value: 'offensive_content', label: 'Offensive Content', severity: 'medium' },
    { value: 'fraud', label: 'Fraudulent Activity', severity: 'critical' },
    { value: 'other', label: 'Other Violation', severity: 'low' },
  ],
} as const;

export type ProhibitedCategoryId = keyof typeof PROHIBITED_CONTENT.CATEGORIES;
export type ReputationTier = keyof typeof PROHIBITED_CONTENT.REPUTATION_TIERS;
export type SeverityLevel = keyof typeof PROHIBITED_CONTENT.SEVERITY_LEVELS;
