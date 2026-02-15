export interface MerchantSDKConfig {
  apiKey: string;
  baseUrl?: string;
  environment?: 'sandbox' | 'production';
}

export interface CreateOrderRequest {
  merchant_reference_id: string;
  buyer_wallet_address: string;
  product_id: string;
  quantity?: number;
  payment_token?: string;
  shipping_address?: any;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  merchant_reference_id: string;
  status: string;
  payment_status: string;
  amount: number;
  fee_amount: number;
  seller_payout: number;
  payment_token: string;
  quantity?: number;
  buyer_wallet_address?: string;
  shipping_address?: any;
  tracking_number?: string;
  tracking_url?: string;
  product?: any;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface OrderList {
  orders: Order[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface PaymentToken {
  symbol: string;
  name: string;
  decimals: number;
  chain: string;
  type: string;
  contract_address?: string;
}

export interface FeeCalculation {
  order_amount: number;
  fee_percentage: number;
  fee_amount: number;
  seller_payout: number;
  payment_token: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  merchant_reference_id?: string;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  mediator_notes?: string;
  created_at: string;
  resolved_at?: string;
  evidence?: any[];
  comments?: any[];
}

export interface Settlement {
  id: string;
  merchant_id: string;
  order_id: string;
  transaction_type: string;
  order_amount: number;
  fee_percentage: number;
  fee_amount: number;
  seller_payout: number;
  payment_token: string;
  settlement_status: string;
  created_at: string;
  settled_at?: string;
}

export interface UsageStats {
  period_days: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: string;
}

export class MerchantSDKError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MerchantSDKError';
  }
}

export class MerchantSDK {
  private apiKey: string;
  private baseUrl: string;
  private environment: 'sandbox' | 'production';

  constructor(config: MerchantSDKConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment || 'sandbox';
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
  }

  private getDefaultBaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
      : 'http://localhost:54321/functions/v1';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...(options.headers || {})
    };

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new MerchantSDKError(
          data.error || 'Request failed',
          response.status,
          data.errorCode,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof MerchantSDKError) {
        throw error;
      }
      throw new MerchantSDKError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(
      '/merchant-api-orders',
      {
        method: 'POST',
        body: JSON.stringify(order)
      }
    );
    return response.order;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(
      `/merchant-api-orders/${orderId}`,
      { method: 'GET' }
    );
    return response.order;
  }

  async listOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderList> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/merchant-api-orders?${query}` : '/merchant-api-orders';

    const response = await this.request<{ success: boolean; orders: Order[]; pagination: any }>(
      endpoint,
      { method: 'GET' }
    );

    return {
      orders: response.orders,
      pagination: response.pagination
    };
  }

  async markOrderShipped(
    orderId: string,
    tracking: {
      tracking_number?: string;
      tracking_url?: string;
      carrier?: string;
    }
  ): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(
      `/merchant-api-orders/${orderId}/ship`,
      {
        method: 'POST',
        body: JSON.stringify(tracking)
      }
    );
    return response.order;
  }

  async updateTracking(
    orderId: string,
    tracking: {
      tracking_number?: string;
      tracking_url?: string;
    }
  ): Promise<Order> {
    const response = await this.request<{ success: boolean; order: Order }>(
      `/merchant-api-orders/${orderId}/tracking`,
      {
        method: 'PATCH',
        body: JSON.stringify(tracking)
      }
    );
    return response.order;
  }

  async getPaymentTokens(): Promise<{
    tokens: PaymentToken[];
    escrow_info: any;
  }> {
    return await this.request<{
      success: boolean;
      tokens: PaymentToken[];
      escrow_info: any;
    }>('/merchant-api-info/payment-tokens', { method: 'GET' });
  }

  async calculateFees(amount: number, token: string = 'ETH'): Promise<FeeCalculation> {
    const response = await this.request<{
      success: boolean;
      calculation: FeeCalculation;
    }>(`/merchant-api-info/fees?amount=${amount}&token=${token}`, {
      method: 'GET'
    });
    return response.calculation;
  }

  async getSettlements(params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<{
    settlements: Settlement[];
    summary: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const endpoint = query ? `/merchant-api-info/settlements?${query}` : '/merchant-api-info/settlements';

    return await this.request<{
      success: boolean;
      settlements: Settlement[];
      summary: any;
    }>(endpoint, { method: 'GET' });
  }

  async getUsageStats(days: number = 7): Promise<{
    usage_stats: UsageStats;
    hourly_breakdown: any[];
  }> {
    return await this.request<{
      success: boolean;
      usage_stats: UsageStats;
      hourly_breakdown: any[];
    }>(`/merchant-api-info/usage?days=${days}`, { method: 'GET' });
  }

  async getOrderDisputes(orderId: string): Promise<{
    disputes: Dispute[];
    dispute_count: number;
  }> {
    return await this.request<{
      success: boolean;
      order_id: string;
      disputes: Dispute[];
      dispute_count: number;
    }>(`/merchant-api-disputes/orders/${orderId}`, { method: 'GET' });
  }

  async getDisputeDetails(disputeId: string): Promise<Dispute> {
    const response = await this.request<{
      success: boolean;
      dispute: Dispute;
    }>(`/merchant-api-disputes/disputes/${disputeId}`, { method: 'GET' });
    return response.dispute;
  }

  async listDisputes(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    disputes: Dispute[];
    pagination: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/merchant-api-disputes?${query}` : '/merchant-api-disputes';

    return await this.request<{
      success: boolean;
      disputes: Dispute[];
      pagination: any;
    }>(endpoint, { method: 'GET' });
  }

  async addDisputeEvidence(
    disputeId: string,
    evidence: {
      evidence_type: string;
      description: string;
      file_url?: string;
    }
  ): Promise<any> {
    const response = await this.request<{
      success: boolean;
      evidence: any;
    }>(`/merchant-api-disputes/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence)
    });
    return response.evidence;
  }

  async addDisputeComment(
    disputeId: string,
    comment: string
  ): Promise<any> {
    const response = await this.request<{
      success: boolean;
      comment: any;
    }>(`/merchant-api-disputes/disputes/${disputeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
    return response.comment;
  }

  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = window.crypto || (globalThis as any).crypto;
    if (!crypto) return false;

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(payload);

      return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ).then((key: CryptoKey) => {
        return crypto.subtle.sign('HMAC', key, messageData);
      }).then((signatureBuffer: ArrayBuffer) => {
        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const computedSignature = hashArray
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        return computedSignature === signature;
      });
    } catch {
      return false;
    }
  }
}

export default MerchantSDK;
