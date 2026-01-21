import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useBlockchainService } from './useBlockchainService';
import { useContractAddresses } from './useContractAddresses';
import { supabase, requireSupabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const ESCROW_ABI = [
  'function platformFeePercent() external view returns (uint256)',
  'function nonGhettoFeeAddition() external view returns (uint256)',
  'function sellerHoldPercent() external view returns (uint256)',
  'function REQUIRED_GHETTO_COLLATERAL() external view returns (uint256)',
  'function setPlatformFee(uint256 _feePercent) external',
  'function setNonGhettoFeeAddition(uint256 _feeAddition) external',
  'function setSellerHoldPercent(uint256 _holdPercent) external',
  'function resolveDispute(string memory _orderId, bool _favorBuyer) external',
  'function getOrder(string memory _orderId) external view returns (tuple(string orderId, address buyer, address seller, uint256 amount, uint256 sellerHoldAmount, address paymentToken, uint8 status, uint256 createdAt, uint256 deliveryDeadline, bool buyerConfirmed, bool sellerConfirmed, bool sellerAgreed))',
  'function sellerBalances(address seller, address token) external view returns (uint256)',
  'function sellerGhettoCollateral(address seller) external view returns (uint256)',
  'function sellerHeldFunds(address seller) external view returns (uint256)',
  'function getAvailableCollateral(address seller) external view returns (uint256)',
  'function owner() external view returns (address)',
  'function cancelOrder(string memory _orderId) external',
  'function releaseFunds(string memory _orderId) external',
  'event OrderCreated(string indexed orderId, address indexed buyer, address indexed seller, uint256 amount, address paymentToken)',
  'event OrderFunded(string indexed orderId, uint256 amount, address paymentToken)',
  'event OrderShipped(string indexed orderId)',
  'event OrderDelivered(string indexed orderId)',
  'event OrderCompleted(string indexed orderId)',
  'event OrderDisputed(string indexed orderId)',
  'event OrderCancelled(string indexed orderId)',
  'event FundsReleased(string indexed orderId, address indexed seller, uint256 amount, address token)'
];

export interface EscrowSettings {
  platformFeePercent: number;
  nonGhettoFeeAddition: number;
  sellerHoldPercent: number;
  requiredGhettoCollateral: number;
  owner: string;
  contractAddress: string;
}

export interface EscrowDeal {
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  amountWei: string;
  sellerHoldAmount: number;
  paymentToken: string;
  paymentTokenSymbol: string;
  status: string;
  onChainStatus: number;
  createdAt: Date;
  deliveryDeadline?: Date;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  sellerAgreed: boolean;
}

export interface SellerCollateral {
  address: string;
  totalCollateral: number;
  availableCollateral: number;
  heldFunds: number;
  maxOrderValue: number;
}

export interface EscrowStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  disputedDeals: number;
  totalVolume: number;
  totalFeesCollected: number;
  totalCollateralLocked: number;
}

export function useEscrowManager() {
  const { addresses } = useContractAddresses('polygon');
  const {
    executeTransaction,
    getContract,
    isLoading: blockchainLoading
  } = useBlockchainService();

  const [escrowSettings, setEscrowSettings] = useState<EscrowSettings | null>(null);
  const [deals, setDeals] = useState<EscrowDeal[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const escrowAddress = addresses.escrow || import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS;
  const ghettoAddress = addresses.ghettoToken || import.meta.env.VITE_GHETTO_TOKEN_ADDRESS;
  const usdcAddress = addresses.usdc || import.meta.env.VITE_USDC_CONTRACT_ADDRESS;

  const getEscrowContract = useCallback(() => {
    return {
      address: escrowAddress,
      abi: ESCROW_ABI,
      name: 'EscrowContract',
      type: 'escrow' as const
    };
  }, [escrowAddress]);

  const loadEscrowSettings = useCallback(async () => {
    try {
      const contract = await getContract(getEscrowContract());

      const [platformFee, nonGhettoFee, sellerHold, requiredCollateral, owner] = await Promise.all([
        contract.platformFeePercent(),
        contract.nonGhettoFeeAddition(),
        contract.sellerHoldPercent(),
        contract.REQUIRED_GHETTO_COLLATERAL(),
        contract.owner()
      ]);

      const settings: EscrowSettings = {
        platformFeePercent: parseInt(platformFee.toString()) / 100,
        nonGhettoFeeAddition: parseInt(nonGhettoFee.toString()) / 100,
        sellerHoldPercent: parseInt(sellerHold.toString()) / 100,
        requiredGhettoCollateral: parseFloat(ethers.formatUnits(requiredCollateral, 2)),
        owner,
        contractAddress: escrowAddress
      };

      setEscrowSettings(settings);
      return settings;
    } catch (error) {
      logger.error('Failed to load escrow settings', 'useEscrowManager', error);
      throw error;
    }
  }, [getContract, getEscrowContract, escrowAddress]);

  const loadDeals = useCallback(async (filters?: {
    status?: string;
    buyer?: string;
    seller?: string;
  }) => {
    try {
      const supabaseClient = requireSupabase();

      let query = supabaseClient
        .from('escrow_deal_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('on_chain_status', filters.status);
      }
      if (filters?.buyer) {
        query = query.eq('buyer_address', filters.buyer);
      }
      if (filters?.seller) {
        query = query.eq('seller_address', filters.seller);
      }

      const { data, error } = await query;

      if (error) throw error;

      const dealList: EscrowDeal[] = (data || []).map(d => ({
        orderId: d.on_chain_order_id,
        buyerAddress: d.buyer_address,
        sellerAddress: d.seller_address,
        amount: parseFloat(d.amount),
        amountWei: d.amount_wei,
        sellerHoldAmount: parseFloat(d.seller_hold_amount || 0),
        paymentToken: d.payment_token_address,
        paymentTokenSymbol: d.payment_token_symbol || 'GHETTO',
        status: d.on_chain_status,
        onChainStatus: parseInt(d.on_chain_status),
        createdAt: new Date(d.created_at_chain || d.created_at),
        buyerConfirmed: false,
        sellerConfirmed: false,
        sellerAgreed: true
      }));

      setDeals(dealList);
      return dealList;
    } catch (error) {
      logger.error('Failed to load deals', 'useEscrowManager', error);
      return [];
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const supabaseClient = requireSupabase();

      const { data: dealsData, error: dealsError } = await supabaseClient
        .from('escrow_deal_tracking')
        .select('on_chain_status, amount');

      if (dealsError) throw dealsError;

      const totalDeals = dealsData?.length || 0;
      const activeDeals = dealsData?.filter(d => ['Created', 'Funded', 'Shipped'].includes(d.on_chain_status)).length || 0;
      const completedDeals = dealsData?.filter(d => d.on_chain_status === 'Completed').length || 0;
      const disputedDeals = dealsData?.filter(d => d.on_chain_status === 'Disputed').length || 0;
      const totalVolume = dealsData?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0;

      const stats: EscrowStats = {
        totalDeals,
        activeDeals,
        completedDeals,
        disputedDeals,
        totalVolume,
        totalFeesCollected: totalVolume * 0.025,
        totalCollateralLocked: 0
      };

      setStats(stats);
      return stats;
    } catch (error) {
      logger.error('Failed to load stats', 'useEscrowManager', error);
      return null;
    }
  }, []);

  const updatePlatformFee = useCallback(async (feePercent: number): Promise<string> => {
    try {
      setIsLoading(true);

      const basisPoints = Math.round(feePercent * 100);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'setPlatformFee',
        [basisPoints]
      );

      await loadEscrowSettings();

      logger.info('Platform fee updated', 'useEscrowManager', {
        feePercent,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update platform fee', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadEscrowSettings]);

  const updateNonGhettoFeeAddition = useCallback(async (feeAddition: number): Promise<string> => {
    try {
      setIsLoading(true);

      const basisPoints = Math.round(feeAddition * 100);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'setNonGhettoFeeAddition',
        [basisPoints]
      );

      await loadEscrowSettings();

      logger.info('Non-GHETTO fee addition updated', 'useEscrowManager', {
        feeAddition,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update non-GHETTO fee addition', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadEscrowSettings]);

  const updateSellerHoldPercent = useCallback(async (holdPercent: number): Promise<string> => {
    try {
      setIsLoading(true);

      const basisPoints = Math.round(holdPercent * 100);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'setSellerHoldPercent',
        [basisPoints]
      );

      await loadEscrowSettings();

      logger.info('Seller hold percent updated', 'useEscrowManager', {
        holdPercent,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update seller hold percent', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadEscrowSettings]);

  const resolveDispute = useCallback(async (orderId: string, favorBuyer: boolean): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'resolveDispute',
        [orderId, favorBuyer]
      );

      await loadDeals();

      logger.info('Dispute resolved', 'useEscrowManager', {
        orderId,
        favorBuyer,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to resolve dispute', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadDeals]);

  const forceReleaseFunds = useCallback(async (orderId: string): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'releaseFunds',
        [orderId]
      );

      await loadDeals();

      logger.info('Funds released (force)', 'useEscrowManager', {
        orderId,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to force release funds', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadDeals]);

  const forceCancelOrder = useCallback(async (orderId: string): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getEscrowContract(),
        'cancelOrder',
        [orderId]
      );

      await loadDeals();

      logger.info('Order cancelled (force)', 'useEscrowManager', {
        orderId,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to force cancel order', 'useEscrowManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getEscrowContract, loadDeals]);

  const getSellerCollateral = useCallback(async (sellerAddress: string): Promise<SellerCollateral> => {
    try {
      const contract = await getContract(getEscrowContract());

      const [totalCollateral, heldFunds, availableCollateral] = await Promise.all([
        contract.sellerGhettoCollateral(sellerAddress),
        contract.sellerHeldFunds(sellerAddress),
        contract.getAvailableCollateral(sellerAddress)
      ]);

      return {
        address: sellerAddress,
        totalCollateral: parseFloat(ethers.formatUnits(totalCollateral, 2)),
        availableCollateral: parseFloat(ethers.formatUnits(availableCollateral, 2)),
        heldFunds: parseFloat(ethers.formatUnits(heldFunds, 2)),
        maxOrderValue: parseFloat(ethers.formatUnits(availableCollateral, 2))
      };
    } catch (error) {
      logger.error('Failed to get seller collateral', 'useEscrowManager', error);
      return {
        address: sellerAddress,
        totalCollateral: 0,
        availableCollateral: 0,
        heldFunds: 0,
        maxOrderValue: 0
      };
    }
  }, [getContract, getEscrowContract]);

  const getSellerBalance = useCallback(async (
    sellerAddress: string,
    tokenAddress: string
  ): Promise<number> => {
    try {
      const contract = await getContract(getEscrowContract());
      const balance = await contract.sellerBalances(sellerAddress, tokenAddress);
      const decimals = tokenAddress === ghettoAddress ? 2 : 6;
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      logger.error('Failed to get seller balance', 'useEscrowManager', error);
      return 0;
    }
  }, [getContract, getEscrowContract, ghettoAddress]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEscrowSettings(),
        loadDeals(),
        loadStats()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadEscrowSettings, loadDeals, loadStats]);

  useEffect(() => {
    if (escrowAddress) {
      refreshData();
    }
  }, [escrowAddress]);

  return {
    escrowSettings,
    deals,
    stats,
    isLoading: isLoading || blockchainLoading,
    updatePlatformFee,
    updateNonGhettoFeeAddition,
    updateSellerHoldPercent,
    resolveDispute,
    forceReleaseFunds,
    forceCancelOrder,
    getSellerCollateral,
    getSellerBalance,
    loadEscrowSettings,
    loadDeals,
    loadStats,
    refreshData
  };
}
