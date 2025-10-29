import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useEscrow } from './useEscrow';
import { useMessaging } from './useMessaging';
import { useReferrals } from './useReferrals';
import { useWeb3 } from './useWeb3';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { ethers } from 'ethers';

// Contract addresses
const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';
const GHETTO_CONTRACT_ADDRESS = import.meta.env.VITE_GHETTO_TOKEN_ADDRESS || '0xB0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c';

// Contract ABIs
const ESCROW_ABI = [
  'function platformFeePercent() external view returns (uint256)',
  'function nonGhettoFeeAddition() external view returns (uint256)',
  'function sellerHoldPercent() external view returns (uint256)',
  'function setPlatformFee(uint256 _feePercent) external',
  'function setNonGhettoFeeAddition(uint256 _feeAddition) external',
  'function setSellerHoldPercent(uint256 _holdPercent) external',
  'function resolveDispute(string memory _orderId, bool _favorBuyer) external',
  'function owner() external view returns (address)',
];

const GHETTO_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function externalTransfersAllowed() external view returns (bool)',
  'function blacklisted(address account) external view returns (bool)',
  'function marketplaceContracts(address contractAddress) external view returns (bool)',
  'function setBlacklisted(address account, bool _blacklisted) external',
  'function setMarketplaceContract(address contractAddress, bool whitelisted) external',
  'function setExternalTransfersAllowed(bool allowed) external',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function burnFrom(address account, uint256 amount) external',
  'function pause() external',
  'function unpause() external',
  'function paused() external view returns (bool)',
  'function owner() external view returns (address)',
  'function getTokenInfo() external view returns (string, string, uint8, uint256, bool)',
];

export interface DisputeCase {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  productTitle: string;
  amount: number;
  disputeReason: string;
  createdAt: Date;
  deadline: Date;
  status: 'pending' | 'under_review' | 'resolved' | 'expired';
  evidence: DisputeEvidence[];
  resolution?: DisputeResolution;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface DisputeEvidence {
  id: string;
  submittedBy: string;
  type: 'text' | 'image' | 'document';
  content: string;
  timestamp: Date;
}

export interface DisputeResolution {
  decision: 'favor_buyer' | 'favor_seller' | 'partial_refund';
  reasoning: string;
  refundAmount?: number;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'suspended' | 'banned' | 'under_review';
  suspensionReason?: string;
  suspensionExpiry?: Date;
  totalTransactions: number;
  totalDisputes: number;
  riskScore: number;
  joinedAt: Date;
  lastActivity: Date;
}

export interface TransactionRecord {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  flagged: boolean;
  flagReason?: string;
}

export interface EscrowContractSettings {
  platformFeePercent: number;
  nonGhettoFeeAddition: number;
  sellerHoldPercent: number;
  owner: string;
}

export interface GhettoTokenSettings {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  externalTransfersAllowed: boolean;
  paused: boolean;
  owner: string;
}

export interface BlacklistedAddress {
  address: string;
  reason: string;
  blacklistedAt: Date;
  blacklistedBy: string;
}

export interface WhitelistedContract {
  address: string;
  name: string;
  whitelistedAt: Date;
  whitelistedBy: string;
}

export interface ReferralSystemStats {
  totalReferrers: number;
  totalReferredUsers: number;
  totalGhettoEarned: number;
  totalGhettoRedeemed: number;
  activeReferralCodes: number;
  pendingRewards: number;
  averageReferralsPerUser: number;
  conversionRate: number;
}

export interface ReferralSettings {
  signupRewardGhetto: number;
  firstPurchaseRewardGhetto: number;
  commissionPercent: number;
  minRedeemGhetto: number;
  maxRedeemGhetto: number;
  referralCodeLength: number;
  referralLinkExpiry: number;
}

export function useSiteMaster() {
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [escrowSettings, setEscrowSettings] = useState<EscrowContractSettings | null>(null);
  const [ghettoSettings, setGhettoSettings] = useState<GhettoTokenSettings | null>(null);
  const [blacklistedAddresses, setBlacklistedAddresses] = useState<BlacklistedAddress[]>([]);
  const [whitelistedContracts, setWhitelistedContracts] = useState<WhitelistedContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  // Referral system state
  const [referralStats, setReferralStats] = useState<ReferralSystemStats | null>(null);
  const [referralSettings, setReferralSettings] = useState<ReferralSettings | null>(null);
  const [allReferralCodes, setAllReferralCodes] = useState<any[]>([]);
  const [allReferredUsers, setAllReferredUsers] = useState<any[]>([]);
  const [allReferralTransactions, setAllReferralTransactions] = useState<any[]>([]);
  const [allReferralBalances, setAllReferralBalances] = useState<any[]>([]);

  // Reporting and moderation state
  const [violationReports, setViolationReports] = useState<any[]>([]);
  const [moderationActions, setModerationActions] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const { user } = useAuth();
  const { sendMessage, createConversation } = useMessaging();
  const { provider, account } = useWeb3();

  // Check if current user is site master
  const isSiteMaster = user?.email === 'master@ghetto.finance' || user?.username === 'sitemaster';

  useEffect(() => {
    if (isSiteMaster) {
      loadSiteMasterData();
      loadContractSettings();
    }
  }, [isSiteMaster, account]);

  const getContracts = async () => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    const signer = await provider.getSigner();
    const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);
    const ghettoContract = new ethers.Contract(GHETTO_CONTRACT_ADDRESS, GHETTO_TOKEN_ABI, signer);
    
    return { escrowContract, ghettoContract, signer };
  };

  const loadContractSettings = async () => {
    if (!provider || !account) return;

    setContractLoading(true);
    try {
      const { escrowContract, ghettoContract } = await getContracts();

      // Load Escrow contract settings
      const [platformFee, nonGhettoFee, sellerHold, escrowOwner] = await Promise.all([
        escrowContract.platformFeePercent(),
        escrowContract.nonGhettoFeeAddition(),
        escrowContract.sellerHoldPercent(),
        escrowContract.owner(),
      ]);

      setEscrowSettings({
        platformFeePercent: parseInt(platformFee.toString()) / 100, // Convert from basis points
        nonGhettoFeeAddition: parseInt(nonGhettoFee.toString()) / 100,
        sellerHoldPercent: parseInt(sellerHold.toString()) / 100,
        owner: escrowOwner,
      });

      // Load GHETTO token settings
      const [tokenInfo, paused, ghettoOwner] = await Promise.all([
        ghettoContract.getTokenInfo(),
        ghettoContract.paused(),
        ghettoContract.owner(),
      ]);

      setGhettoSettings({
        name: tokenInfo[0],
        symbol: tokenInfo[1],
        decimals: parseInt(tokenInfo[2].toString()),
        totalSupply: parseFloat(ethers.formatUnits(tokenInfo[3], tokenInfo[2])),
        externalTransfersAllowed: tokenInfo[4],
        paused,
        owner: ghettoOwner,
      });

      // Load blacklisted addresses (mock data for now - in real app would query events)
      setBlacklistedAddresses([
        {
          address: '0x1234567890123456789012345678901234567890',
          reason: 'Fraudulent activity',
          blacklistedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          blacklistedBy: 'sitemaster',
        },
      ]);

      // Load whitelisted contracts (mock data for now)
      setWhitelistedContracts([
        {
          address: ESCROW_CONTRACT_ADDRESS,
          name: 'Escrow Contract',
          whitelistedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          whitelistedBy: 'sitemaster',
        },
      ]);

    } catch (error) {
      console.error('Failed to load contract settings:', error);
    } finally {
      setContractLoading(false);
    }
  };

  const loadSiteMasterData = () => {
    // Load mock data for demonstration
    const mockDisputes: DisputeCase[] = [
      {
        id: 'dispute_001',
        orderId: 'order_001',
        buyerId: '0x1234567890123456789012345678901234567890',
        sellerId: '0x2345678901234567890123456789012345678901',
        productTitle: 'Premium Hardware Wallet',
        amount: 199.99,
        disputeReason: 'Product not as described - missing biometric feature',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        status: 'pending',
        evidence: [
          {
            id: 'evidence_001',
            submittedBy: '0x1234567890123456789012345678901234567890',
            type: 'text',
            content: 'The product description clearly stated biometric authentication, but the received item only has PIN protection.',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          }
        ],
        priority: 'medium'
      },
      {
        id: 'dispute_002',
        orderId: 'order_002',
        buyerId: '0x3456789012345678901234567890123456789012',
        sellerId: '0x4567890123456789012345678901234567890123',
        productTitle: 'NFT Art Collection License',
        amount: 129.99,
        disputeReason: 'Never received product after payment',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        status: 'under_review',
        evidence: [],
        priority: 'high'
      }
    ];

    const mockTransactions: TransactionRecord[] = [
      {
        id: 'tx_001',
        orderId: 'order_001',
        buyerId: '0x1234567890123456789012345678901234567890',
        sellerId: '0x2345678901234567890123456789012345678901',
        amount: 199.99,
        status: 'disputed',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        flagged: true,
        flagReason: 'Dispute raised by buyer'
      },
      {
        id: 'tx_002',
        orderId: 'order_002',
        buyerId: '0x3456789012345678901234567890123456789012',
        sellerId: '0x4567890123456789012345678901234567890123',
        amount: 129.99,
        status: 'disputed',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        flagged: true,
        flagReason: 'Non-delivery claim'
      },
      {
        id: 'tx_003',
        orderId: 'order_003',
        buyerId: '0x5678901234567890123456789012345678901234',
        sellerId: '0x6789012345678901234567890123456789012345',
        amount: 799.99,
        status: 'completed',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        flagged: false
      }
    ];

    const mockUsers: UserAccount[] = [
      {
        id: '0x1234567890123456789012345678901234567890',
        username: 'cryptobuyer1',
        email: 'buyer1@example.com',
        status: 'active',
        totalTransactions: 5,
        totalDisputes: 1,
        riskScore: 2,
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: '0x2345678901234567890123456789012345678901',
        username: 'techseller',
        email: 'seller1@example.com',
        status: 'under_review',
        totalTransactions: 12,
        totalDisputes: 2,
        riskScore: 4,
        joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    setDisputes(mockDisputes);
    setTransactions(mockTransactions);
    setUserAccounts(mockUsers);
  };

  // Escrow Contract Management Functions
  const updatePlatformFee = async (feePercent: number) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { escrowContract } = await getContracts();
      
      // Convert percentage to basis points (e.g., 2.5% = 250)
      const basisPoints = Math.round(feePercent * 100);
      
      const tx = await escrowContract.setPlatformFee(basisPoints);
      await tx.wait();
      
      // Update local state
      if (escrowSettings) {
        setEscrowSettings({
          ...escrowSettings,
          platformFeePercent: feePercent
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update platform fee:', error);
      throw new Error('Failed to update platform fee');
    } finally {
      setIsLoading(false);
    }
  };

  const updateNonGhettoFeeAddition = async (feeAddition: number) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { escrowContract } = await getContracts();
      
      const basisPoints = Math.round(feeAddition * 100);
      const tx = await escrowContract.setNonGhettoFeeAddition(basisPoints);
      await tx.wait();
      
      if (escrowSettings) {
        setEscrowSettings({
          ...escrowSettings,
          nonGhettoFeeAddition: feeAddition
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update non-GHETTO fee addition:', error);
      throw new Error('Failed to update non-GHETTO fee addition');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSellerHoldPercent = async (holdPercent: number) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { escrowContract } = await getContracts();
      
      const basisPoints = Math.round(holdPercent * 100);
      const tx = await escrowContract.setSellerHoldPercent(basisPoints);
      await tx.wait();
      
      if (escrowSettings) {
        setEscrowSettings({
          ...escrowSettings,
          sellerHoldPercent: holdPercent
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update seller hold percent:', error);
      throw new Error('Failed to update seller hold percent');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveEscrowDispute = async (orderId: string, favorBuyer: boolean) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { escrowContract } = await getContracts();
      
      const tx = await escrowContract.resolveDispute(orderId, favorBuyer);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to resolve escrow dispute:', error);
      throw new Error('Failed to resolve escrow dispute on blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  // GHETTO Token Management Functions
  const setAddressBlacklisted = async (address: string, blacklisted: boolean, reason?: string) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tx = await ghettoContract.setBlacklisted(address, blacklisted);
      await tx.wait();
      
      // Update local state
      if (blacklisted) {
        const newBlacklistedAddress: BlacklistedAddress = {
          address,
          reason: reason || 'No reason provided',
          blacklistedAt: new Date(),
          blacklistedBy: user?.username || 'sitemaster',
        };
        setBlacklistedAddresses(prev => [...prev, newBlacklistedAddress]);
      } else {
        setBlacklistedAddresses(prev => prev.filter(addr => addr.address !== address));
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update blacklist:', error);
      throw new Error('Failed to update address blacklist');
    } finally {
      setIsLoading(false);
    }
  };

  const setMarketplaceContractWhitelisted = async (contractAddress: string, whitelisted: boolean, name?: string) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tx = await ghettoContract.setMarketplaceContract(contractAddress, whitelisted);
      await tx.wait();
      
      // Update local state
      if (whitelisted) {
        const newWhitelistedContract: WhitelistedContract = {
          address: contractAddress,
          name: name || 'Unknown Contract',
          whitelistedAt: new Date(),
          whitelistedBy: user?.username || 'sitemaster',
        };
        setWhitelistedContracts(prev => [...prev, newWhitelistedContract]);
      } else {
        setWhitelistedContracts(prev => prev.filter(contract => contract.address !== contractAddress));
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update marketplace contract whitelist:', error);
      throw new Error('Failed to update marketplace contract whitelist');
    } finally {
      setIsLoading(false);
    }
  };

  const setExternalTransfersAllowed = async (allowed: boolean) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tx = await ghettoContract.setExternalTransfersAllowed(allowed);
      await tx.wait();
      
      if (ghettoSettings) {
        setGhettoSettings({
          ...ghettoSettings,
          externalTransfersAllowed: allowed
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to update external transfers setting:', error);
      throw new Error('Failed to update external transfers setting');
    } finally {
      setIsLoading(false);
    }
  };

  const mintGhettoTokens = async (toAddress: string, amount: number) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      // Convert amount to token units (GHETTO has 2 decimals)
      const tokenAmount = ethers.parseUnits(amount.toString(), 2);
      
      const tx = await ghettoContract.mint(toAddress, tokenAmount);
      await tx.wait();
      
      // Update total supply in local state
      if (ghettoSettings) {
        setGhettoSettings({
          ...ghettoSettings,
          totalSupply: ghettoSettings.totalSupply + amount
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to mint GHETTO tokens:', error);
      throw new Error('Failed to mint GHETTO tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const burnGhettoTokens = async (amount: number, fromAddress?: string) => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tokenAmount = ethers.parseUnits(amount.toString(), 2);
      
      let tx;
      if (fromAddress && fromAddress !== account) {
        tx = await ghettoContract.burnFrom(fromAddress, tokenAmount);
      } else {
        tx = await ghettoContract.burn(tokenAmount);
      }
      
      await tx.wait();
      
      // Update total supply in local state
      if (ghettoSettings) {
        setGhettoSettings({
          ...ghettoSettings,
          totalSupply: ghettoSettings.totalSupply - amount
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to burn GHETTO tokens:', error);
      throw new Error('Failed to burn GHETTO tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseGhettoTransfers = async () => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tx = await ghettoContract.pause();
      await tx.wait();
      
      if (ghettoSettings) {
        setGhettoSettings({
          ...ghettoSettings,
          paused: true
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to pause GHETTO transfers:', error);
      throw new Error('Failed to pause GHETTO transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const unpauseGhettoTransfers = async () => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { ghettoContract } = await getContracts();
      
      const tx = await ghettoContract.unpause();
      await tx.wait();
      
      if (ghettoSettings) {
        setGhettoSettings({
          ...ghettoSettings,
          paused: false
        });
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to unpause GHETTO transfers:', error);
      throw new Error('Failed to unpause GHETTO transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAddressBlacklisted = async (address: string): Promise<boolean> => {
    if (!provider) return false;

    try {
      const { ghettoContract } = await getContracts();
      return await ghettoContract.blacklisted(address);
    } catch (error) {
      console.error('Failed to check blacklist status:', error);
      return false;
    }
  };

  const checkContractWhitelisted = async (contractAddress: string): Promise<boolean> => {
    if (!provider) return false;

    try {
      const { ghettoContract } = await getContracts();
      return await ghettoContract.marketplaceContracts(contractAddress);
    } catch (error) {
      console.error('Failed to check whitelist status:', error);
      return false;
    }
  };

  // Enhanced dispute resolution with blockchain integration
  const resolveDispute = async (disputeId: string, resolution: DisputeResolution) => {
    setIsLoading(true);
    try {
      const dispute = disputes.find(d => d.id === disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Resolve on blockchain if connected
      if (provider && account) {
        try {
          const favorBuyer = resolution.decision === 'favor_buyer' || 
                           (resolution.decision === 'partial_refund' && (resolution.refundAmount || 0) > dispute.amount * 0.5);
          
          await resolveEscrowDispute(dispute.orderId, favorBuyer);
        } catch (error) {
          console.error('Blockchain resolution failed:', error);
          // Continue with database resolution even if blockchain fails
        }
      }

      // Update local state
      setDisputes(prev => prev.map(d => 
        d.id === disputeId 
          ? { ...d, status: 'resolved' as const, resolution }
          : d
      ));

      // Notify parties of resolution
      if (dispute) {
        const buyerConversation = await createConversation(dispute.buyerId);
        const sellerConversation = await createConversation(dispute.sellerId);

        const resolutionMessage = `Dispute Resolution: Your case for "${dispute.productTitle}" has been resolved. Decision: ${resolution.decision.replace('_', ' ')}. Reasoning: ${resolution.reasoning}`;

        await sendMessage(buyerConversation, resolutionMessage, 'system');
        await sendMessage(sellerConversation, resolutionMessage, 'system');
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const suspendUser = async (userId: string, reason: string, duration: number) => {
    setIsLoading(true);
    try {
      const suspensionExpiry = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      
      setUserAccounts(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'suspended' as const, suspensionReason: reason, suspensionExpiry }
          : user
      ));

      // Notify user of suspension
      const conversation = await createConversation(userId);
      await sendMessage(
        conversation, 
        `Your account has been suspended for: ${reason}. Suspension expires: ${suspensionExpiry.toLocaleDateString()}`,
        'system'
      );
    } catch (error) {
      console.error('Failed to suspend user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contactUser = async (userId: string, message: string) => {
    try {
      const conversation = await createConversation(userId);
      await sendMessage(conversation, `[Site Master] ${message}`, 'system');
    } catch (error) {
      console.error('Failed to contact user:', error);
      throw error;
    }
  };

  const flagTransaction = async (transactionId: string, reason: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === transactionId 
        ? { ...tx, flagged: true, flagReason: reason }
        : tx
    ));
  };

  const getDisputeStats = () => {
    return {
      total: disputes.length,
      pending: disputes.filter(d => d.status === 'pending').length,
      underReview: disputes.filter(d => d.status === 'under_review').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      expired: disputes.filter(d => d.status === 'expired').length,
      urgent: disputes.filter(d => d.priority === 'urgent').length
    };
  };

  const getTransactionStats = () => {
    return {
      total: transactions.length,
      flagged: transactions.filter(tx => tx.flagged).length,
      completed: transactions.filter(tx => tx.status === 'completed').length,
      disputed: transactions.filter(tx => tx.status === 'disputed').length,
      totalValue: transactions.reduce((sum, tx) => sum + tx.amount, 0)
    };
  };

  const getUserStats = () => {
    return {
      total: userAccounts.length,
      active: userAccounts.filter(u => u.status === 'active').length,
      suspended: userAccounts.filter(u => u.status === 'suspended').length,
      underReview: userAccounts.filter(u => u.status === 'under_review').length,
      highRisk: userAccounts.filter(u => u.riskScore >= 7).length
    };
  };

  // Referral System Management Functions
  const loadReferralSystemData = async () => {
    if (!isSiteMaster) return;

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      // Load referral codes
      const { data: codes, error: codesError } = await supabaseClient
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (codesError) throw codesError;
      setAllReferralCodes(codes || []);

      // Load referred users
      const { data: referred, error: referredError } = await supabaseClient
        .from('referred_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (referredError) throw referredError;
      setAllReferredUsers(referred || []);

      // Load referral transactions
      const { data: transactions, error: transactionsError } = await supabaseClient
        .from('referral_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (transactionsError) throw transactionsError;
      setAllReferralTransactions(transactions || []);

      // Load referral balances
      const { data: balances, error: balancesError } = await supabaseClient
        .from('referral_balances')
        .select('*')
        .order('balance_ghetto', { ascending: false });
      if (balancesError) throw balancesError;
      setAllReferralBalances(balances || []);

      // Load referral settings from platform_settings
      const { data: settings, error: settingsError } = await supabaseClient
        .from('platform_settings')
        .select('*')
        .in('key', [
          'referral_signup_reward_ghetto',
          'referral_first_purchase_reward_ghetto',
          'referral_commission_rate_percent',
          'referral_min_redeem_ghetto',
          'referral_max_redeem_ghetto'
        ]);
      if (settingsError) throw settingsError;

      const settingsMap: Record<string, string> = {};
      settings?.forEach(s => { settingsMap[s.key] = s.value; });

      setReferralSettings({
        signupRewardGhetto: parseFloat(settingsMap['referral_signup_reward_ghetto'] || '0'),
        firstPurchaseRewardGhetto: parseFloat(settingsMap['referral_first_purchase_reward_ghetto'] || '0'),
        commissionPercent: parseFloat(settingsMap['referral_commission_rate_percent'] || '0'),
        minRedeemGhetto: parseFloat(settingsMap['referral_min_redeem_ghetto'] || '0'),
        maxRedeemGhetto: parseFloat(settingsMap['referral_max_redeem_ghetto'] || '0'),
        referralCodeLength: 6,
        referralLinkExpiry: 0,
      });

      // Calculate stats
      const totalGhettoEarned = transactions?.reduce((sum, tx) =>
        tx.type !== 'redemption' ? sum + parseFloat(tx.amount_ghetto) : sum, 0) || 0;
      const totalGhettoRedeemed = transactions?.filter(tx => tx.type === 'redemption')
        .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount_ghetto)), 0) || 0;
      const activeReferrers = new Set(referred?.map(r => r.referrer_id)).size;

      setReferralStats({
        totalReferrers: activeReferrers,
        totalReferredUsers: referred?.length || 0,
        totalGhettoEarned,
        totalGhettoRedeemed,
        activeReferralCodes: codes?.length || 0,
        pendingRewards: balances?.reduce((sum, b) => sum + parseFloat(b.balance_ghetto), 0) || 0,
        averageReferralsPerUser: activeReferrers > 0 ? (referred?.length || 0) / activeReferrers : 0,
        conversionRate: 0,
      });

    } catch (error) {
      console.error('Failed to load referral system data:', error);
      handleSupabaseError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReferralSettings = async (settings: Partial<ReferralSettings>) => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const updates: Array<{ key: string; value: string }> = [];

      if (settings.signupRewardGhetto !== undefined) {
        updates.push({ key: 'referral_signup_reward_ghetto', value: settings.signupRewardGhetto.toString() });
      }
      if (settings.firstPurchaseRewardGhetto !== undefined) {
        updates.push({ key: 'referral_first_purchase_reward_ghetto', value: settings.firstPurchaseRewardGhetto.toString() });
      }
      if (settings.commissionPercent !== undefined) {
        updates.push({ key: 'referral_commission_rate_percent', value: settings.commissionPercent.toString() });
      }
      if (settings.minRedeemGhetto !== undefined) {
        updates.push({ key: 'referral_min_redeem_ghetto', value: settings.minRedeemGhetto.toString() });
      }
      if (settings.maxRedeemGhetto !== undefined) {
        updates.push({ key: 'referral_max_redeem_ghetto', value: settings.maxRedeemGhetto.toString() });
      }

      for (const update of updates) {
        const { error } = await supabaseClient
          .from('platform_settings')
          .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });

        if (error) throw error;
      }

      // Reload settings
      await loadReferralSystemData();

      return true;
    } catch (error) {
      console.error('Failed to update referral settings:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forceClaimReward = async (referredUserId: string, rewardType: 'signup' | 'first_purchase') => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const field = rewardType === 'signup' ? 'account_reward_claimed' : 'first_purchase_reward_claimed';

      const { error } = await supabaseClient
        .from('referred_users')
        .update({ [field]: true })
        .eq('referred_user_id', referredUserId);

      if (error) throw error;

      await loadReferralSystemData();
      return true;
    } catch (error) {
      console.error('Failed to force claim reward:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adjustUserReferralBalance = async (userId: string, amount: number, reason: string) => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      // Update balance
      const { data: currentBalance } = await supabaseClient
        .from('referral_balances')
        .select('balance_ghetto')
        .eq('user_id', userId)
        .single();

      const newBalance = (currentBalance ? parseFloat(currentBalance.balance_ghetto) : 0) + amount;

      await supabaseClient
        .from('referral_balances')
        .upsert({
          user_id: userId,
          balance_ghetto: newBalance,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      // Log transaction
      await supabaseClient
        .from('referral_transactions')
        .insert({
          user_id: userId,
          type: amount > 0 ? 'commission' : 'redemption',
          amount_ghetto: amount,
          source_id: user?.id,
        });

      // Log audit event
      await supabaseClient.rpc('log_audit_event', {
        p_user_id: user?.id,
        p_action_type: 'referral_balance_adjustment',
        p_action_description: `Adjusted referral balance for user ${userId} by ${amount} GHETTO. Reason: ${reason}`,
        p_target_type: 'user',
        p_target_id: userId,
        p_metadata: { amount, reason },
      });

      await loadReferralSystemData();
      return true;
    } catch (error) {
      console.error('Failed to adjust referral balance:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Content Moderation Functions
  const loadViolationReports = async () => {
    if (!isSiteMaster) return;

    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('platform_violation_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViolationReports(data || []);
    } catch (error) {
      console.error('Failed to load violation reports:', error);
      handleSupabaseError(error);
    }
  };

  const reviewViolationReport = async (reportId: string, status: string, resolutionNotes: string, actionTaken: string) => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const { error } = await supabaseClient
        .from('platform_violation_reports')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
          action_taken: actionTaken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log moderation action
      await supabaseClient
        .from('moderation_actions')
        .insert({
          moderator_id: user?.id,
          action_type: status === 'resolved' ? 'approve' : 'reject',
          target_type: 'report',
          target_id: reportId,
          reason: resolutionNotes,
          details: actionTaken,
          report_id: reportId,
        });

      await loadViolationReports();
      return true;
    } catch (error) {
      console.error('Failed to review violation report:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Role Management Functions
  const loadUserRoles = async () => {
    if (!isSiteMaster) return;

    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Failed to load user roles:', error);
      handleSupabaseError(error);
    }
  };

  const assignUserRole = async (userId: string, role: string, expiresAt?: Date, notes?: string) => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const { error } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: user?.id,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt?.toISOString(),
          is_active: true,
          notes,
        });

      if (error) throw error;

      // Log audit event
      await supabaseClient.rpc('log_audit_event', {
        p_user_id: user?.id,
        p_action_type: 'role_assignment',
        p_action_description: `Assigned role ${role} to user ${userId}`,
        p_target_type: 'user',
        p_target_id: userId,
        p_metadata: { role, expires_at: expiresAt?.toISOString(), notes },
      });

      await loadUserRoles();
      return true;
    } catch (error) {
      console.error('Failed to assign user role:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeUserRole = async (roleId: string) => {
    if (!isSiteMaster) throw new Error('Unauthorized');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const { error } = await supabaseClient
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      await loadUserRoles();
      return true;
    } catch (error) {
      console.error('Failed to revoke user role:', error);
      handleSupabaseError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load all site master data
  useEffect(() => {
    if (isSiteMaster) {
      loadSiteMasterData();
      loadContractSettings();
      loadReferralSystemData();
      loadViolationReports();
      loadUserRoles();
    }
  }, [isSiteMaster, account]);

  return {
    isSiteMaster,
    disputes,
    transactions,
    userAccounts,
    escrowSettings,
    ghettoSettings,
    blacklistedAddresses,
    whitelistedContracts,
    isLoading,
    contractLoading,

    // Referral system data
    referralStats,
    referralSettings,
    allReferralCodes,
    allReferredUsers,
    allReferralTransactions,
    allReferralBalances,

    // Moderation data
    violationReports,
    moderationActions,
    userRoles,

    // Original functions
    resolveDispute,
    suspendUser,
    contactUser,
    flagTransaction,
    getDisputeStats,
    getTransactionStats,
    getUserStats,

    // Contract management functions
    loadContractSettings,
    updatePlatformFee,
    updateNonGhettoFeeAddition,
    updateSellerHoldPercent,
    resolveEscrowDispute,
    setAddressBlacklisted,
    setMarketplaceContractWhitelisted,
    setExternalTransfersAllowed,
    mintGhettoTokens,
    burnGhettoTokens,
    pauseGhettoTransfers,
    unpauseGhettoTransfers,
    checkAddressBlacklisted,
    checkContractWhitelisted,

    // Referral management functions
    loadReferralSystemData,
    updateReferralSettings,
    forceClaimReward,
    adjustUserReferralBalance,

    // Content moderation functions
    loadViolationReports,
    reviewViolationReport,

    // Role management functions
    loadUserRoles,
    assignUserRole,
    revokeUserRole,
  };
}