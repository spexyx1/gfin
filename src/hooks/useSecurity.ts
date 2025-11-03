import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  backupCodesGenerated: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  deviceTrust: boolean;
  ipWhitelist: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'wallet_connect' | 'suspicious_activity';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  details?: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  userAgent: string;
  ipAddress: string;
  lastUsed: Date;
  trusted: boolean;
}

export function useSecurity() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailVerified: false,
    phoneVerified: false,
    backupCodesGenerated: false,
    sessionTimeout: 30, // minutes
    loginNotifications: true,
    deviceTrust: true,
    ipWhitelist: [],
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { account } = useWeb3();

  // Load security data
  useEffect(() => {
    const savedSettings = localStorage.getItem('securitySettings');
    const savedEvents = localStorage.getItem('securityEvents');
    const savedDevices = localStorage.getItem('trustedDevices');

    if (savedSettings) setSecuritySettings(JSON.parse(savedSettings));
    if (savedEvents) setSecurityEvents(JSON.parse(savedEvents));
    if (savedDevices) setTrustedDevices(JSON.parse(savedDevices));
  }, []);

  // Save security data
  useEffect(() => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  useEffect(() => {
    localStorage.setItem('securityEvents', JSON.stringify(securityEvents));
  }, [securityEvents]);

  useEffect(() => {
    localStorage.setItem('trustedDevices', JSON.stringify(trustedDevices));
  }, [trustedDevices]);

  // Generate secure random string
  const generateSecureRandom = (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  };

  // Hash password with salt
  const hashPassword = async (password: string, salt?: string): Promise<{ hash: string; salt: string }> => {
    const encoder = new TextEncoder();
    const usedSalt = salt || generateSecureRandom(16);
    const data = encoder.encode(password + usedSalt);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { hash, salt: usedSalt };
  };

  // Encrypt sensitive data
  const encryptData = async (data: string, key?: string): Promise<{ encrypted: string; key: string; iv: string }> => {
    const encoder = new TextEncoder();
    const usedKey = key || generateSecureRandom(32);
    
    // Generate key from string
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(usedKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ghetto-finance-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoder.encode(data)
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
      key: usedKey,
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
    };
  };

  // Decrypt sensitive data
  const decryptData = async (encryptedData: string, key: string, iv: string): Promise<string> => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ghetto-finance-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const encryptedBuffer = new Uint8Array(encryptedData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ivBuffer = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      encryptedBuffer
    );

    return decoder.decode(decrypted);
  };

  // Log security event
  const logSecurityEvent = (
    type: SecurityEvent['type'],
    success: boolean,
    details?: string
  ) => {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      ipAddress: '192.168.1.1', // In real app, get actual IP
      userAgent: navigator.userAgent,
      location: 'Unknown', // In real app, use geolocation API
      success,
      details,
    };

    setSecurityEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
  };

  // Enable 2FA
  const enable2FA = async (): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> => {
    setIsLoading(true);
    try {
      // Generate TOTP secret
      const secret = generateSecureRandom(32);
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => generateSecureRandom(8));
      
      // In real app, generate actual QR code
      const qrCode = `otpauth://totp/GHETTO%20FINANCE?secret=${secret}&issuer=GHETTO%20FINANCE`;
      
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: true,
        backupCodesGenerated: true,
      }));

      logSecurityEvent('login', true, '2FA enabled');
      
      return { secret, qrCode, backupCodes };
    } finally {
      setIsLoading(false);
    }
  };

  // Disable 2FA
  const disable2FA = async () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: false,
      backupCodesGenerated: false,
    }));
    logSecurityEvent('login', true, '2FA disabled');
  };

  // Add trusted device
  const addTrustedDevice = (name: string) => {
    if (!securitySettings.deviceTrust) return;
    
    const device: TrustedDevice = {
      id: `device_${Date.now()}`,
      name,
      userAgent: securitySettings.deviceFingerprinting ? navigator.userAgent : 'Hidden',
      ipAddress: securitySettings.ipTracking ? '192.168.1.1' : 'Hidden', // In real app, get actual IP
      lastUsed: new Date(),
      trusted: true,
    };

    setTrustedDevices(prev => [...prev, device]);
    logSecurityEvent('login', true, `Trusted device added: ${name}`);
  };

  // Remove trusted device
  const removeTrustedDevice = (deviceId: string) => {
    setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
    logSecurityEvent('login', true, 'Trusted device removed');
  };

  // Update security settings
  const updateSecuritySettings = (updates: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => ({ ...prev, ...updates }));
    logSecurityEvent('login', true, 'Security settings updated');
  };

  // Check for suspicious activity
  const checkSuspiciousActivity = (): boolean => {
    const recentEvents = securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 60000 // Last minute
    );

    const failedLogins = recentEvents.filter(
      event => event.type === 'failed_login' && !event.success
    ).length;

    return failedLogins >= 5; // 5 failed attempts in 1 minute
  };

  // Generate security report
  const generateSecurityReport = () => {
    const last30Days = securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
    );

    return {
      totalEvents: last30Days.length,
      successfulLogins: last30Days.filter(e => e.type === 'login' && e.success).length,
      failedLogins: last30Days.filter(e => e.type === 'failed_login').length,
      suspiciousActivity: last30Days.filter(e => e.type === 'suspicious_activity').length,
      uniqueIPs: [...new Set(last30Days.map(e => e.ipAddress))].length,
      securityScore: calculateSecurityScore(),
    };
  };

  // Calculate security score
  const calculateSecurityScore = (): number => {
    let score = 0;
    
    if (securitySettings.twoFactorEnabled) score += 30;
    if (securitySettings.emailVerified) score += 20;
    if (securitySettings.phoneVerified) score += 15;
    if (securitySettings.backupCodesGenerated) score += 10;
    if (securitySettings.deviceTrust) score += 10;
    if (securitySettings.loginNotifications) score += 5;
    if (securitySettings.sessionTimeout <= 15) score += 10;
    
    return Math.min(score, 100);
  };

  return {
    securitySettings,
    securityEvents,
    trustedDevices,
    isLoading,
    
    // Cryptographic functions
    generateSecureRandom,
    hashPassword,
    encryptData,
    decryptData,
    
    // Security management
    logSecurityEvent,
    enable2FA,
    disable2FA,
    addTrustedDevice,
    removeTrustedDevice,
    updateSecuritySettings,
    
    // Security monitoring
    checkSuspiciousActivity,
    generateSecurityReport,
    calculateSecurityScore,
  };
}