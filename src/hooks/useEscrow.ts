import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useMessaging } from './useMessaging';
import { useWeb3 } from './useWeb3';
import { useContractAddresses } from './useContractAddresses';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { ethers } from 'ethers';
import { useSponsorship } from './useSponsorship';
import { TRANSACTION_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';
import { ERC20_ABI, ESCROW_ABI } from '../config/contractAbis';

export interface EscrowOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  productId?: string;
  amount: number;
  sellerHoldAmount: number;
  description: string;
  status: 'created' | 'funded' | 'shipped' | 'delivered' | 'awaiting_release' | 'funds_released' | 'completed' | 'disputed' | 'cancelled';
  sellerAgreed: boolean;
  createdAt: Date;
  updatedAt: Date;
  fundedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  deliveryConfirmedAt?: Date;
  fundsReleaseDeadline?: Date;
  fundsReleasedAt?: Date;
  autoReleaseEligible?: boolean;
  disputeReason?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  paymentToken?: string;
  currency?: string;
}

export function useEscrow() {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { sendMessage, createConversation } = useMessaging();
  const { provider, account, networkName } = useWeb3();
  const { addresses } = useContractAddresses(networkName?.toLowerCase().replace(' ', '') || 'polygon');
  const { calculateSponsorPayouts, recordSponsorTransactions } = useSponsorship();

  const ESCROW_CONTRACT_ADDRESS = addresses.escrow || import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS;
  const USDC_CONTRACT_ADDRESS = addresses.usdc || import.meta.env.VITE_USDC_CONTRACT_ADDRESS;
  const GHETTO_CONTRACT_ADDRESS = addresses.ghettoToken || import.meta.env.VITE_GHETTO_TOKEN_ADDRESS;

  // Helper function to get token decimals
  const getTokenDecimals = async (tokenAddress: string): Promise<number> => {
    // Hardcoded decimals for known tokens
    if (tokenAddress === GHETTO_CONTRACT_ADDRESS) {
      return 2; // GHETTO has 2 decimals
    }
    if (tokenAddress === USDC_CONTRACT_ADDRESS) {
      return 6; // USDC has 6 decimals
    }
    
    // For other tokens, fetch dynamically
    try {
      if (provider) {
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        return await tokenContract.decimals();
      }
    } catch (error) {
      logger.error('Failed to get token decimals', 'useEscrow', error);
    }
    
    // Default to 18 decimals for unknown tokens
    return 18;
  };

  // Get contract instances
  const getContracts = async () => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    if (!ESCROW_CONTRACT_ADDRESS || !USDC_CONTRACT_ADDRESS || !GHETTO_CONTRACT_ADDRESS) {
      throw new Error('Contract addresses not configured. Please deploy contracts first.');
    }

    const signer = await provider.getSigner();
    const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer);
    const ghettoContract = new ethers.Contract(GHETTO_CONTRACT_ADDRESS, ERC20_ABI, signer);
    const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

    return { usdcContract, ghettoContract, escrowContract, signer };
  };

  // Check token balance
  const checkTokenBalance = async (amount: number, tokenAddress: string): Promise<boolean> => {
    try {
      const signer = await provider!.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const balance = await tokenContract.balanceOf(account);
      const decimals = await getTokenDecimals(tokenAddress);
      const requiredAmount = ethers.parseUnits(amount.toString(), decimals);
      return balance >= requiredAmount;
    } catch (error) {
      logger.error('Failed to check token balance', 'useEscrow', error);
      return false;
    }
  };

  // Approve token spending
  const approveToken = async (amount: number, tokenAddress: string): Promise<void> => {
    try {
      const signer = await provider!.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await getTokenDecimals(tokenAddress);
      const approvalAmount = ethers.parseUnits(amount.toString(), decimals);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, ESCROW_CONTRACT_ADDRESS);
      
      if (currentAllowance < approvalAmount) {
        const tx = await tokenContract.approve(ESCROW_CONTRACT_ADDRESS, approvalAmount);
        await tx.wait();
      }
    } catch (error) {
      logger.error('Failed to approve token', 'useEscrow', error);
      throw new Error('Failed to approve token spending');
    }
  };

  // Load user's orders from Supabase
  const loadOrders = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      const { data: ordersData, error } = await supabaseClient
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(username, display_name),
          seller:seller_id(username, display_name),
          product:product_id(title, images)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert database records to EscrowOrder format
      const escrowOrders: EscrowOrder[] = ordersData?.map(order => ({
        id: order.id,
        buyerId: order.buyer_id,
        sellerId: order.seller_id,
        productId: order.product_id,
        amount: parseFloat(order.amount),
        sellerHoldAmount: parseFloat(order.seller_hold_amount),
        description: order.description,
        status: order.status as EscrowOrder['status'],
        sellerAgreed: order.seller_agreed,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        fundedAt: order.funded_at ? new Date(order.funded_at) : undefined,
        shippedAt: order.shipped_at ? new Date(order.shipped_at) : undefined,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        deliveryConfirmedAt: order.delivery_confirmed_at ? new Date(order.delivery_confirmed_at) : undefined,
        fundsReleaseDeadline: order.funds_release_deadline ? new Date(order.funds_release_deadline) : undefined,
        fundsReleasedAt: order.funds_released_at ? new Date(order.funds_released_at) : undefined,
        autoReleaseEligible: order.auto_release_eligible,
        disputeReason: order.dispute_reason,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        carrier: order.carrier,
        estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery) : undefined,
        paymentToken: order.payment_token,
        currency: order.currency,
      })) || [];

      setOrders(escrowOrders);
    } catch (error) {
      logger.error('Failed to load orders', 'useEscrow', error);
      handleSupabaseError(error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load orders when user changes
  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [user, loadOrders]);

  const createEscrow = async (
    sellerId: string,
    amount: number,
    description: string,
    paymentTokenAddress: string = GHETTO_CONTRACT_ADDRESS,
    paymentCurrency: string = 'GHETTO',
    productId?: string
  ) => {
    // Input validation
    if (!sellerId || typeof sellerId !== 'string') {
      throw new Error('Valid seller ID is required');
    }
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new Error('Amount must be a positive number');
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Description is required');
    }
    if (!user) {
      throw new Error('User not authenticated');
    }
    if (user.id === sellerId) {
      throw new Error('Cannot create escrow with yourself as seller');
    }
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Check token balance
      const hasBalance = await checkTokenBalance(amount, paymentTokenAddress);
      if (!hasBalance) {
        throw new Error(`Insufficient ${paymentCurrency} balance`);
      }

      const supabaseClient = requireSupabase();
      
      // Create order in database
      const { data: newOrder, error } = await supabaseClient
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: sellerId,
          product_id: productId,
          amount,
          description,
          status: 'created',
          currency: paymentCurrency,
          seller_agreed: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create order on smart contract
      try {
        const { escrowContract } = await getContracts();
        
        // Create order on blockchain
        const createTx = await escrowContract.createOrder(
          newOrder.id,
          sellerId,
          ethers.parseUnits(amount.toString(), await getTokenDecimals(paymentTokenAddress)),
          paymentTokenAddress
        );
        await createTx.wait();
        
        logger.debug('Order created on blockchain', 'useEscrow', createTx.hash);
      } catch (contractError) {
        logger.error('Smart contract error', 'useEscrow', contractError);
        // If contract fails, we should clean up the database entry
        await supabaseClient
          .from('orders')
          .delete()
          .eq('id', newOrder.id);
        
        throw new Error('Failed to create order on blockchain');
      }

      // Convert database record to EscrowOrder format
      const escrowOrder: EscrowOrder = {
        id: newOrder.id,
        buyerId: newOrder.buyer_id,
        sellerId: newOrder.seller_id,
        productId: newOrder.product_id,
        amount: parseFloat(newOrder.amount),
        sellerHoldAmount: parseFloat(newOrder.seller_hold_amount),
        description: newOrder.description,
        status: newOrder.status as EscrowOrder['status'],
        sellerAgreed: newOrder.seller_agreed,
        createdAt: new Date(newOrder.created_at),
        currency: paymentCurrency,
        updatedAt: new Date(newOrder.updated_at),
        paymentToken: paymentTokenAddress,
      };

      // Update local state
      setOrders(prev => [escrowOrder, ...prev]);

      // Create conversation and send order notification
      try {
        const conversationId = await createConversation(sellerId);
        await sendMessage(
          conversationId,
          `New order created: ${description}. Please review and agree to proceed with the transaction.`,
          'order',
          escrowOrder.id
        );
      } catch (error) {
        logger.error('Failed to send order notification', 'useEscrow', error);
      }

      return escrowOrder.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit GHETTO collateral for sellers
  const depositGhettoCollateral = async (amount: number): Promise<void> => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Check GHETTO balance
      const hasBalance = await checkTokenBalance(amount, GHETTO_CONTRACT_ADDRESS);
      if (!hasBalance) {
        throw new Error('Insufficient GHETTO balance');
      }

      // Approve GHETTO spending
      await approveToken(amount, GHETTO_CONTRACT_ADDRESS);
      
      // Deposit collateral
      const { escrowContract } = await getContracts();
      const depositTx = await escrowContract.depositGhettoCollateral(
        ethers.parseUnits(amount.toString(), await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))
      );
      await depositTx.wait();
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to deposit GHETTO collateral');
    } finally {
      setIsLoading(false);
    }
  };

  // Get seller's GHETTO collateral info
  const getSellerCollateralInfo = async (): Promise<{
    totalCollateral: number;
    availableCollateral: number;
    heldCollateral: number;
    maxOrderValue: number;
  }> => {
    if (!provider || !account) {
      return { totalCollateral: 0, availableCollateral: 0, heldCollateral: 0, maxOrderValue: 0 };
    }

    try {
      const { escrowContract } = await getContracts();
      const [totalCollateral, heldFunds, availableCollateral] = await Promise.all([
        escrowContract.sellerGhettoCollateral(account),
        escrowContract.sellerHeldFunds(account),
        escrowContract.getAvailableCollateral(account)
      ]);

      return {
        totalCollateral: parseFloat(ethers.formatUnits(totalCollateral, await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))),
        availableCollateral: parseFloat(ethers.formatUnits(availableCollateral, await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))),
        heldCollateral: parseFloat(ethers.formatUnits(heldFunds, await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))),
        maxOrderValue: parseFloat(ethers.formatUnits(availableCollateral, await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))),
      };
    } catch (error) {
      logger.error('Failed to get seller collateral info', 'useEscrow', error);
      return { totalCollateral: 0, availableCollateral: 0, heldCollateral: 0, maxOrderValue: 0 };
    }
  };

  // Withdraw GHETTO collateral (only available collateral, not held)
  const withdrawGhettoCollateral = async (amount: number): Promise<void> => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    setIsLoading(true);
    try {
      // Get current collateral info to validate withdrawal
      const collateralInfo = await getSellerCollateralInfo();

      if (amount > collateralInfo.availableCollateral) {
        throw new Error(`Cannot withdraw ${amount} GHETTO. Only ${collateralInfo.availableCollateral} GHETTO is available for withdrawal. ${collateralInfo.heldCollateral} GHETTO is held in active orders.`);
      }

      // Withdraw collateral from smart contract
      const { escrowContract } = await getContracts();
      const withdrawTx = await escrowContract.withdrawGhettoCollateral(
        ethers.parseUnits(amount.toString(), await getTokenDecimals(GHETTO_CONTRACT_ADDRESS))
      );
      await withdrawTx.wait();

      logger.debug('Collateral withdrawn successfully', 'useEscrow', { amount, txHash: withdrawTx.hash });
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total fee for a payment
  const calculateTotalFee = async (amount: number, paymentTokenAddress: string): Promise<number> => {
    if (!provider) {
      const baseFee = amount * 0.025;
      const additionalFee = paymentTokenAddress !== GHETTO_CONTRACT_ADDRESS ? amount * TRANSACTION_CONFIG.fees.platformFee : 0;
      return baseFee + additionalFee;
    }

    try {
      const { escrowContract } = await getContracts();
      const decimals = await getTokenDecimals(paymentTokenAddress);
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      const feeWei = await escrowContract.calculateTotalFee(paymentTokenAddress, amountWei);
      return parseFloat(ethers.formatUnits(feeWei, decimals));
    } catch (error) {
      logger.error('Failed to calculate fee', 'useEscrow', error);
      const baseFee = amount * 0.025;
      const additionalFee = paymentTokenAddress !== GHETTO_CONTRACT_ADDRESS ? amount * TRANSACTION_CONFIG.fees.platformFee : 0;
      return baseFee + additionalFee;
    }
  };

  const agreeToOrder = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Call smart contract first
      const { escrowContract } = await getContracts();
      const agreeTx = await escrowContract.agreeToOrder(orderId);
      await agreeTx.wait();
      
      const supabaseClient = requireSupabase();
      
      // Update order in database
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ 
          seller_agreed: true
        })
        .eq('id', orderId)
        .eq('seller_id', user.id) // Ensure only seller can agree
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              sellerAgreed: true, 
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));

      // Send notification to buyer
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          const conversationId = await createConversation(order.buyerId);
          await sendMessage(
            conversationId,
            `Order agreed! Your payment has been processed and the order is now funded. The seller will ship your item soon.`,
            'order',
            orderId
          );
        } catch (error) {
          logger.error('Failed to send agreement notification', 'useEscrow', error);
        }
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to agree to order');
    } finally {
      setIsLoading(false);
    }
  };

  const shipOrder = async (orderId: string, trackingNumber?: string, carrier?: string, estimatedDelivery?: Date) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Call smart contract first
      const { escrowContract } = await getContracts();
      const shipTx = await escrowContract.markAsShipped(orderId);
      await shipTx.wait();
      
      const supabaseClient = requireSupabase();
      
      // Generate tracking URL if carrier and tracking number provided
      let trackingUrl = null;
      if (carrier && trackingNumber) {
        const { data: urlData, error: urlError } = await supabaseClient
          .rpc('generate_tracking_url', {
            carrier_name: carrier,
            tracking_num: trackingNumber
          });
        
        if (!urlError && urlData) {
          trackingUrl = urlData;
        }
      }
      
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ 
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          carrier: carrier,
          estimated_delivery: estimatedDelivery?.toISOString()
        })
        .eq('id', orderId)
        .eq('seller_id', user.id) // Ensure only seller can ship
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'shipped' as const, 
              shippedAt: new Date(updatedOrder.shipped_at),
              updatedAt: new Date(updatedOrder.updated_at),
              trackingNumber: updatedOrder.tracking_number,
              trackingUrl: updatedOrder.tracking_url,
              carrier: updatedOrder.carrier,
              estimatedDelivery: updatedOrder.estimated_delivery ? new Date(updatedOrder.estimated_delivery) : undefined,
            }
          : order
      ));

      // Send shipping notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          const conversationId = await createConversation(order.buyerId);
          let shippingMessage = `Great news! Your order has been shipped and is on its way. Please confirm delivery once you receive it.`;
          
          if (trackingNumber) {
            shippingMessage += `\n\nTracking Information:\n• Tracking Number: ${trackingNumber}`;
            if (carrier) {
              shippingMessage += `\n• Carrier: ${carrier}`;
            }
            if (trackingUrl) {
              shippingMessage += `\n• Track your package: ${trackingUrl}`;
            }
            if (estimatedDelivery) {
              shippingMessage += `\n• Estimated Delivery: ${estimatedDelivery.toLocaleDateString()}`;
            }
          }
          
          await sendMessage(conversationId, shippingMessage, 'order', orderId);
        } catch (error) {
          logger.error('Failed to send shipping notification', 'useEscrow', error);
        }
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to ship order');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Call smart contract first (confirmDelivery no longer releases funds)
      const { escrowContract } = await getContracts();
      const confirmTx = await escrowContract.confirmDelivery(orderId);
      await confirmTx.wait();

      const supabaseClient = requireSupabase();

      // Update order to awaiting_release status
      // The trigger will automatically set delivery_confirmed_at and calculate funds_release_deadline
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({
          status: 'awaiting_release'
        })
        .eq('id', orderId)
        .eq('buyer_id', user.id) // Ensure only buyer can confirm delivery
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              status: 'awaiting_release' as const,
              deliveryConfirmedAt: new Date(updatedOrder.delivery_confirmed_at),
              fundsReleaseDeadline: updatedOrder.funds_release_deadline ? new Date(updatedOrder.funds_release_deadline) : undefined,
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));

      // Send notification to seller about delivery confirmation
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          const conversationId = await createConversation(order.sellerId);
          const deadlineDays = 7;
          await sendMessage(
            conversationId,
            `Good news! The buyer has confirmed delivery of the order. Funds will be automatically released in ${deadlineDays} days unless the buyer raises a dispute.`,
            'order',
            orderId
          );
        } catch (error) {
          logger.error('Failed to send delivery confirmation notification', 'useEscrow', error);
        }
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to confirm delivery');
    } finally {
      setIsLoading(false);
    }
  };

  const releaseFunds = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      // Get order details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Ensure only buyer can manually release funds
      if (order.buyerId !== user.id) {
        throw new Error('Only the buyer can release funds');
      }

      // Ensure order is in awaiting_release status
      if (order.status !== 'awaiting_release') {
        throw new Error('Order must be in awaiting_release status to release funds');
      }

      // Create fund release request
      const { data: releaseRequest, error: requestError } = await supabaseClient
        .from('fund_release_requests')
        .insert({
          order_id: orderId,
          requested_by: user.id,
          request_type: 'manual',
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      // Calculate and record sponsor payouts BEFORE releasing funds
      let sponsorPayouts = [];
      try {
        sponsorPayouts = await calculateSponsorPayouts(orderId, order.sellerId, order.amount);
        if (sponsorPayouts.length > 0) {
          await recordSponsorTransactions(sponsorPayouts);
        }
      } catch (sponsorError) {
        logger.error('Error processing sponsor payouts', 'useEscrow', sponsorError);
        // Continue with fund release even if sponsor payout recording fails
      }

      // Call smart contract to release funds
      const { escrowContract } = await getContracts();
      const releaseTx = await escrowContract.releaseFunds(orderId);
      const receipt = await releaseTx.wait();

      // Update order status to funds_released
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({
          status: 'funds_released',
          funds_released_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mark release request as completed
      await supabaseClient
        .from('fund_release_requests')
        .update({
          status: 'completed',
          failure_reason: receipt.hash
        })
        .eq('id', releaseRequest.id);

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'funds_released' as const,
              fundsReleasedAt: new Date(updatedOrder.funds_released_at),
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : o
      ));

      // Auto-complete immediately after release
      try {
        const { error: completeError } = await supabaseClient
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId);

        if (!completeError) {
          setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'completed' as const } : o
          ));
        }
      } catch (error) {
        logger.error('Failed to auto-complete order', 'useEscrow', error);
      }

      // Send notification to seller
      try {
        const conversationId = await createConversation(order.sellerId);
        await sendMessage(
          conversationId,
          `Great news! The buyer has manually released the funds for this order. The funds have been transferred to your account. Transaction: ${receipt.hash}`,
          'order',
          orderId
        );
      } catch (error) {
        logger.error('Failed to send fund release notification', 'useEscrow', error);
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to release funds');
    } finally {
      setIsLoading(false);
    }
  };

  const autoReleaseFunds = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      // Get order details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if deadline has passed
      if (order.fundsReleaseDeadline && new Date() < order.fundsReleaseDeadline) {
        throw new Error('Fund release deadline has not been reached yet');
      }

      // Check if order is eligible for auto-release
      if (!order.autoReleaseEligible) {
        throw new Error('Order is not eligible for automatic release');
      }

      // Create fund release request
      const { data: releaseRequest, error: requestError } = await supabaseClient
        .from('fund_release_requests')
        .insert({
          order_id: orderId,
          requested_by: user.id,
          request_type: 'auto',
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      // Calculate and record sponsor payouts BEFORE auto-releasing funds
      let sponsorPayouts = [];
      try {
        sponsorPayouts = await calculateSponsorPayouts(orderId, order.sellerId, order.amount);
        if (sponsorPayouts.length > 0) {
          await recordSponsorTransactions(sponsorPayouts);
        }
      } catch (sponsorError) {
        logger.error('Error processing sponsor payouts', 'useEscrow', sponsorError);
        // Continue with fund release even if sponsor payout recording fails
      }

      // Call smart contract to auto-release funds
      const { escrowContract } = await getContracts();
      const releaseTx = await escrowContract.autoReleaseFunds(orderId);
      const receipt = await releaseTx.wait();

      // Use the database function to complete auto-release
      const { error: completeError } = await supabaseClient
        .rpc('complete_auto_release', {
          p_order_id: orderId,
          p_tx_hash: receipt.hash
        });

      if (completeError) {
        throw completeError;
      }

      // Reload orders to get updated state
      await loadOrders();

      // Send notifications to both parties
      try {
        const buyerConversationId = await createConversation(order.buyerId);
        await sendMessage(
          buyerConversationId,
          `The 7-day review period has ended and funds have been automatically released to the seller for this order. Transaction: ${receipt.hash}`,
          'order',
          orderId
        );

        const sellerConversationId = await createConversation(order.sellerId);
        await sendMessage(
          sellerConversationId,
          `Funds have been automatically released to your account after the review period ended. Transaction: ${receipt.hash}`,
          'order',
          orderId
        );
      } catch (error) {
        logger.error('Failed to send auto-release notifications', 'useEscrow', error);
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to auto-release funds');
    } finally {
      setIsLoading(false);
    }
  };

  const disputeOrder = async (orderId: string, reason: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Call smart contract first
      const { escrowContract } = await getContracts();
      const disputeTx = await escrowContract.raiseDispute(orderId);
      await disputeTx.wait();
      
      const supabaseClient = requireSupabase();
      
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ 
          status: 'disputed',
          dispute_reason: reason
        })
        .eq('id', orderId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`) // Either party can dispute
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'disputed' as const, 
              disputeReason: reason,
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));

      // Send dispute notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const otherParty = order.buyerId === user.id ? order.sellerId : order.buyerId;
        try {
          const conversationId = await createConversation(otherParty);
          await sendMessage(
            conversationId,
            `A dispute has been raised for this order: ${reason}. Our support team will review and resolve this matter.`,
            'order',
            orderId
          );
        } catch (error) {
          logger.error('Failed to send dispute notification', 'useEscrow', error);
        }
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to dispute order');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrackingInfo = async (orderId: string, trackingNumber: string, carrier?: string, estimatedDelivery?: Date) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Generate tracking URL if carrier provided
      let trackingUrl = null;
      if (carrier && trackingNumber) {
        const { data: urlData, error: urlError } = await supabaseClient
          .rpc('generate_tracking_url', {
            carrier_name: carrier,
            tracking_num: trackingNumber
          });
        
        if (!urlError && urlData) {
          trackingUrl = urlData;
        }
      }
      
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          carrier: carrier,
          estimated_delivery: estimatedDelivery?.toISOString()
        })
        .eq('id', orderId)
        .eq('seller_id', user.id) // Ensure only seller can update tracking
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              trackingNumber: updatedOrder.tracking_number,
              trackingUrl: updatedOrder.tracking_url,
              carrier: updatedOrder.carrier,
              estimatedDelivery: updatedOrder.estimated_delivery ? new Date(updatedOrder.estimated_delivery) : undefined,
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));

      // Send tracking update notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          const conversationId = await createConversation(order.buyerId);
          let trackingMessage = `Tracking information updated for your order.`;
          
          trackingMessage += `\n\nTracking Information:\n• Tracking Number: ${trackingNumber}`;
          if (carrier) {
            trackingMessage += `\n• Carrier: ${carrier}`;
          }
          if (trackingUrl) {
            trackingMessage += `\n• Track your package: ${trackingUrl}`;
          }
          if (estimatedDelivery) {
            trackingMessage += `\n• Estimated Delivery: ${estimatedDelivery.toLocaleDateString()}`;
          }
          
          await sendMessage(conversationId, trackingMessage, 'order', orderId);
        } catch (error) {
          logger.error('Failed to send tracking update notification', 'useEscrow', error);
        }
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to update tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Call smart contract first
      const { escrowContract } = await getContracts();
      const cancelTx = await escrowContract.cancelOrder(orderId);
      await cancelTx.wait();
      
      const supabaseClient = requireSupabase();
      
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`) // Either party can cancel
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'cancelled' as const,
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrdersByUser = (userAddress: string) => {
    return orders.filter(order => 
      order.buyerId === userAddress || 
      order.sellerId === userAddress
    );
  };

  const getBuyerOrders = (buyerAddress: string) => {
    return orders.filter(order => 
      order.buyerId === buyerAddress
    );
  };

  const getSellerOrders = (sellerAddress: string) => {
    return orders.filter(order => 
      order.sellerId === sellerAddress
    );
  };

  // Fund order with payment token
  const fundOrder = async (orderId: string, amount: number, tokenAddress: string = GHETTO_CONTRACT_ADDRESS) => {
    if (!user) throw new Error('User not authenticated');

    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      // Approve token spending
      await approveToken(amount, tokenAddress);

      // Fund order on smart contract
      const { escrowContract } = await getContracts();
      const fundTx = await escrowContract.fundOrder(orderId);
      await fundTx.wait();
      
      // Update database status
      const supabaseClient = requireSupabase();
      const { data: updatedOrder, error } = await supabaseClient
        .from('orders')
        .update({ status: 'funded' })
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'funded' as const,
              updatedAt: new Date(updatedOrder.updated_at)
            }
          : order
      ));
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to fund order');
    } finally {
      setIsLoading(false);
    }
  };

  // Get seller balance from smart contract
  const getSellerBalance = async (tokenAddress: string = GHETTO_CONTRACT_ADDRESS): Promise<{ available: number; held: number }> => {
    if (!provider || !account) {
      return { available: 0, held: 0 };
    }

    try {
      const { escrowContract } = await getContracts();
      const [availableBalance, heldFunds] = await Promise.all([
        escrowContract.sellerBalances(account, tokenAddress),
        escrowContract.sellerHeldFunds(account)
      ]);

      const decimals = await getTokenDecimals(tokenAddress);
      const ghettoDecimals = await getTokenDecimals(GHETTO_CONTRACT_ADDRESS);
      return {
        available: parseFloat(ethers.formatUnits(availableBalance, decimals)),
        held: parseFloat(ethers.formatUnits(heldFunds, ghettoDecimals)) // Held funds are always in GHETTO
      };
    } catch (error) {
      logger.error('Failed to get seller balance', 'useEscrow', error);
      return { available: 0, held: 0 };
    }
  };

  // Withdraw seller balance
  const withdrawSellerBalance = async (tokenAddress: string = GHETTO_CONTRACT_ADDRESS): Promise<void> => {
    if (!provider || !account) {
      throw new Error('Web3 wallet not connected');
    }

    setIsLoading(true);
    try {
      const { escrowContract } = await getContracts();
      const withdrawTx = await escrowContract.withdrawSellerBalance(tokenAddress);
      await withdrawTx.wait();
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to withdraw seller balance');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    orders,
    isLoading,
    loadOrders,
    createEscrow,
    fundOrder,
    agreeToOrder,
    shipOrder,
    confirmDelivery,
    releaseFunds,
    autoReleaseFunds,
    disputeOrder,
    cancelOrder,
    updateTrackingInfo,
    getSellerBalance,
    withdrawSellerBalance,
    checkTokenBalance,
    depositGhettoCollateral,
    withdrawGhettoCollateral,
    getSellerCollateralInfo,
    calculateTotalFee,
    getOrdersByUser,
    getBuyerOrders,
    getSellerOrders,
  };
}