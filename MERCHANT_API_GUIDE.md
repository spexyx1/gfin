# Merchant API System - Complete Guide

## Overview

The Natively Merchant API allows external businesses to integrate our secure, non-custodial escrow system into their applications. This system provides a complete payment infrastructure with blockchain-based escrow, dispute resolution, and automated fund management.

## Key Features

- **Non-Custodial Escrow**: Smart contract-based escrow on Polygon blockchain
- **Per-Transaction Fees**: Configurable fee percentage (default 2.5%)
- **7-Day Buyer Protection**: Standard hold period with early release option
- **Automated Webhooks**: Real-time notifications for all order events
- **Dispute Resolution**: Built-in mediation system with evidence submission
- **Multi-Currency Support**: ETH, USDC, USDT, and GHETTO tokens
- **Sandbox Environment**: Full testing environment with fake transactions
- **Rate Limiting**: Configurable request limits per merchant
- **TypeScript SDK**: Type-safe SDK for easy integration

## Architecture

### Database Schema

The system includes the following tables:

1. **merchant_accounts** - Core merchant business information and settings
2. **merchant_api_keys** - Secure API key storage with HMAC hashing
3. **merchant_api_usage** - Rate limiting and usage tracking
4. **merchant_orders** - Junction table linking merchant orders to platform orders
5. **merchant_webhooks** - Webhook endpoint configuration
6. **webhook_deliveries** - Webhook delivery tracking and retry logic
7. **merchant_transactions** - Fee tracking and settlement records
8. **api_request_logs** - Complete API request/response logging
9. **merchant_ip_whitelist** - IP-based access control
10. **merchant_sandbox_data** - Sandbox mode data isolation

### Edge Functions

Four Supabase Edge Functions power the API:

1. **merchant-auth** - Authentication and rate limiting
2. **merchant-api-orders** - Order management endpoints
3. **merchant-api-info** - Payment tokens, fees, settlements, usage stats
4. **merchant-api-disputes** - Dispute management and evidence submission
5. **webhook-worker** - Background webhook delivery with retry logic

## Getting Started

### 1. Create Merchant Account

Navigate to the Merchant Dashboard in your user interface:

```
/merchant-dashboard
```

Click "Create Merchant Account" to register as a merchant.

### 2. Generate API Key

In the Merchant Dashboard:

1. Click "Create API Key"
2. Enter a name for the key
3. Select environment (Sandbox or Production)
4. Copy the generated key immediately (it won't be shown again)

API keys follow this format:
- Sandbox: `mk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Production: `mk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Configure Webhooks

Set up webhook endpoints to receive real-time notifications:

1. Go to your Merchant Dashboard
2. Add your webhook URL (must be HTTPS in production)
3. Select which events to subscribe to
4. Save your webhook secret for signature verification

### 4. Start Making API Calls

Use the TypeScript SDK or make direct HTTP requests to the API.

## API Endpoints

Base URL: `https://your-project.supabase.co/functions/v1`

### Authentication

All requests require the `X-API-Key` header:

```bash
curl -X GET \
  https://your-project.supabase.co/functions/v1/merchant-api-orders \
  -H "X-API-Key: mk_test_your_api_key"
```

### Orders API

#### Create Order

```bash
POST /merchant-api-orders
Content-Type: application/json
X-API-Key: your_api_key

{
  "merchant_reference_id": "order-12345",
  "buyer_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "product_id": "uuid",
  "quantity": 1,
  "payment_token": "ETH",
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "metadata": {
    "custom_field": "value"
  }
}
```

#### Get Order

```bash
GET /merchant-api-orders/:order_id
X-API-Key: your_api_key
```

#### List Orders

```bash
GET /merchant-api-orders?status=pending&limit=50&offset=0
X-API-Key: your_api_key
```

#### Mark Order Shipped

```bash
POST /merchant-api-orders/:order_id/ship
Content-Type: application/json
X-API-Key: your_api_key

{
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com",
  "carrier": "UPS"
}
```

#### Update Tracking

```bash
PATCH /merchant-api-orders/:order_id/tracking
Content-Type: application/json
X-API-Key: your_api_key

{
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com"
}
```

### Payment Information API

#### Get Supported Payment Tokens

```bash
GET /merchant-api-info/payment-tokens
X-API-Key: your_api_key
```

Response includes:
- Supported tokens (ETH, USDC, USDT, GHETTO)
- Token details (decimals, contract addresses)
- Escrow configuration

#### Calculate Fees

```bash
GET /merchant-api-info/fees?amount=100&token=ETH
X-API-Key: your_api_key
```

Returns fee breakdown for the specified amount.

#### Get Settlements

```bash
GET /merchant-api-info/settlements?start_date=2024-01-01&end_date=2024-01-31
X-API-Key: your_api_key
```

Returns transaction history with fee summaries.

#### Get Usage Statistics

```bash
GET /merchant-api-info/usage?days=7
X-API-Key: your_api_key
```

Returns API usage metrics and success rates.

### Disputes API

#### Get Order Disputes

```bash
GET /merchant-api-disputes/orders/:order_id
X-API-Key: your_api_key
```

#### Get Dispute Details

```bash
GET /merchant-api-disputes/disputes/:dispute_id
X-API-Key: your_api_key
```

#### List All Disputes

```bash
GET /merchant-api-disputes?status=open&limit=50
X-API-Key: your_api_key
```

#### Add Evidence

```bash
POST /merchant-api-disputes/disputes/:dispute_id/evidence
Content-Type: application/json
X-API-Key: your_api_key

{
  "evidence_type": "photo",
  "description": "Product packaging with tracking label",
  "file_url": "https://storage.example.com/evidence.jpg"
}
```

#### Add Comment

```bash
POST /merchant-api-disputes/disputes/:dispute_id/comments
Content-Type: application/json
X-API-Key: your_api_key

{
  "comment": "Package was delivered on time with signature confirmation"
}
```

## TypeScript SDK Usage

### Installation

Copy the SDK file to your project:

```typescript
import MerchantSDK from './lib/merchantSDK';
```

### Initialize SDK

```typescript
const sdk = new MerchantSDK({
  apiKey: 'mk_test_your_api_key_here',
  environment: 'sandbox'
});
```

### Create Order

```typescript
const order = await sdk.createOrder({
  merchant_reference_id: 'order-12345',
  buyer_wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  product_id: 'uuid',
  quantity: 1,
  payment_token: 'ETH',
  shipping_address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102'
  }
});

console.log('Order ID:', order.id);
console.log('Fee Amount:', order.fee_amount);
console.log('Seller Payout:', order.seller_payout);
```

### Get Order

```typescript
const order = await sdk.getOrder('order-uuid');
console.log('Status:', order.status);
console.log('Payment Status:', order.payment_status);
```

### List Orders

```typescript
const { orders, pagination } = await sdk.listOrders({
  status: 'pending',
  limit: 50,
  offset: 0
});

console.log(`Found ${orders.length} orders`);
console.log(`Total: ${pagination.total}`);
```

### Mark Shipped

```typescript
await sdk.markOrderShipped('order-uuid', {
  tracking_number: '1Z999AA10123456784',
  tracking_url: 'https://tracking.example.com',
  carrier: 'UPS'
});
```

### Get Payment Tokens

```typescript
const { tokens, escrow_info } = await sdk.getPaymentTokens();
console.log('Supported tokens:', tokens);
console.log('Hold period:', escrow_info.standard_hold_period_days);
```

### Calculate Fees

```typescript
const calculation = await sdk.calculateFees(100, 'ETH');
console.log('Order Amount:', calculation.order_amount);
console.log('Fee:', calculation.fee_amount);
console.log('Seller Gets:', calculation.seller_payout);
```

### Error Handling

```typescript
try {
  const order = await sdk.createOrder({...});
} catch (error) {
  if (error instanceof MerchantSDKError) {
    console.error('Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Code:', error.errorCode);
  }
}
```

## Webhooks

### Webhook Events

- `order.created` - New order created via API
- `order.funded` - Payment received on blockchain
- `order.shipped` - Order marked as shipped
- `order.delivered` - Buyer confirmed delivery
- `order.completed` - Funds released to seller
- `order.disputed` - Buyer raised a dispute
- `dispute.resolved` - Mediator resolved dispute
- `payment.received` - Payment detected on blockchain

### Webhook Payload

```json
{
  "event_type": "order.created",
  "event_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "uuid",
    "merchant_reference_id": "order-12345",
    "status": "pending",
    "amount": 100.50,
    "payment_token": "ETH",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Webhook Headers

```
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Event: order.created
X-Webhook-Event-ID: uuid
X-Webhook-Delivery-ID: uuid
```

### Signature Verification

#### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const computed = hmac.update(payload).digest('hex');
  return computed === signature;
}

// Express.js endpoint
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();

  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);
  console.log('Event:', event.event_type);

  res.status(200).send('OK');
});
```

#### TypeScript SDK Method

```typescript
const isValid = await MerchantSDK.verifyWebhookSignature(
  payloadString,
  signature,
  webhookSecret
);
```

### Retry Logic

Failed webhook deliveries are automatically retried:

1. Immediate delivery
2. Retry after 1 minute
3. Retry after 5 minutes
4. Retry after 15 minutes
5. Retry after 1 hour
6. Retry after 2 hours

After 5 failed attempts, the webhook endpoint may be disabled.

## Payment Flow

### Standard Flow (7-Day Hold)

1. **Order Created**: Merchant creates order via API
2. **Payment Received**: Buyer sends funds to escrow contract
3. **Order Shipped**: Merchant marks order as shipped with tracking
4. **Order Delivered**: Buyer confirms delivery or 7 days pass
5. **Funds Released**: Seller receives payment minus platform fee

### Early Release Flow

1. **Order Created**: Merchant creates order via API
2. **Payment Received**: Buyer sends funds to escrow contract
3. **Order Shipped**: Merchant marks order as shipped
4. **Buyer Approves**: Buyer confirms delivery immediately
5. **Funds Released**: Seller receives payment immediately

### Dispute Flow

1. **Dispute Raised**: Buyer reports issue with order
2. **Evidence Submission**: Both parties submit evidence
3. **Mediator Assigned**: Platform mediator reviews case
4. **Resolution**: Mediator decides fund distribution
5. **Funds Distributed**: According to mediator decision

## Fee Structure

### Per-Transaction Fee Model

- Default fee: 2.5% of order amount
- Fees deducted automatically before seller payout
- Custom fees available for verified merchants
- No monthly fees or minimums

### Fee Calculation

```
Order Amount: $100.00
Platform Fee (2.5%): $2.50
Seller Receives: $97.50
```

## Security Best Practices

### API Key Management

1. **Never expose keys in client-side code**
2. **Store keys in environment variables**
3. **Use separate keys for sandbox and production**
4. **Rotate keys regularly**
5. **Revoke compromised keys immediately**

### Webhook Security

1. **Always verify signatures**
2. **Use HTTPS endpoints only**
3. **Implement replay protection**
4. **Set reasonable timeouts**
5. **Log webhook deliveries**

### IP Whitelisting

Configure allowed IP addresses in Merchant Dashboard to restrict API access.

### Data Protection

1. **Never store sensitive payment information**
2. **Use wallet addresses, not credentials**
3. **Implement proper access controls**
4. **Log API requests for auditing**
5. **Monitor for unusual activity**

## Rate Limits

- **Default**: 10,000 requests per day
- **Hourly**: Daily limit / 24
- **Burst**: Up to 100 requests per minute

Rate limit headers in responses:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9950
X-RateLimit-Reset: 1705363200
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_API_KEY` | API key not provided |
| `INVALID_API_KEY` | API key invalid or revoked |
| `EXPIRED_API_KEY` | API key has expired |
| `INACTIVE_MERCHANT` | Merchant account inactive |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `MISSING_FIELDS` | Required fields missing |
| `DUPLICATE_ORDER` | Order reference already exists |
| `PRODUCT_NOT_FOUND` | Product ID invalid |
| `ORDER_NOT_FOUND` | Order not found |
| `ACCESS_DENIED` | Permission denied |
| `INTERNAL_ERROR` | Server error |

## Compliance

This is a **non-custodial** system. Key responsibilities:

- **Merchants**: Handle own KYC/AML compliance
- **Platform**: Facilitates escrow smart contracts
- **Platform**: Provides dispute mediation services
- **Platform**: Does NOT take custody of funds

## Support and Resources

### Documentation
- API Reference: `/api-docs`
- SDK Documentation: `src/lib/merchantSDK.ts`
- Webhook Guide: See "Webhooks" section above

### Dashboard
- Merchant Dashboard: `/merchant-dashboard`
- API Key Management: In Merchant Dashboard
- Usage Statistics: In Merchant Dashboard

### Testing
- Sandbox Environment: Use `mk_test_*` keys
- Test Tokens: Available in sandbox
- Test Webhooks: Configure in dashboard

## Example Integration

Complete example of external e-commerce integration:

```typescript
import MerchantSDK from './lib/merchantSDK';

const sdk = new MerchantSDK({
  apiKey: process.env.NATIVELY_API_KEY,
  environment: 'production'
});

// 1. Customer places order on your site
async function createEscrowOrder(cartData) {
  try {
    const order = await sdk.createOrder({
      merchant_reference_id: cartData.orderId,
      buyer_wallet_address: cartData.walletAddress,
      product_id: cartData.productId,
      quantity: cartData.quantity,
      payment_token: cartData.preferredToken || 'ETH',
      shipping_address: cartData.shippingAddress,
      metadata: {
        customer_email: cartData.email,
        order_notes: cartData.notes
      }
    });

    return {
      escrowOrderId: order.id,
      feeAmount: order.fee_amount,
      sellerPayout: order.seller_payout
    };
  } catch (error) {
    console.error('Failed to create escrow order:', error);
    throw error;
  }
}

// 2. Mark order as shipped when you ship
async function shipOrder(orderId, trackingInfo) {
  await sdk.markOrderShipped(orderId, {
    tracking_number: trackingInfo.trackingNumber,
    tracking_url: trackingInfo.trackingUrl,
    carrier: trackingInfo.carrier
  });
}

// 3. Handle webhook notifications
app.post('/webhooks/natively', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);

  if (!await MerchantSDK.verifyWebhookSignature(
    payload,
    signature,
    process.env.WEBHOOK_SECRET
  )) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  switch (event.event_type) {
    case 'order.funded':
      await handlePaymentReceived(event.data);
      break;
    case 'order.completed':
      await handleFundsReleased(event.data);
      break;
    case 'order.disputed':
      await handleDispute(event.data);
      break;
  }

  res.status(200).send('OK');
});
```

## Changelog

### Version 1.0.0 (2024-02-15)
- Initial release
- Order management API
- Webhook system
- Dispute management
- TypeScript SDK
- Sandbox environment
- Documentation and dashboard

## License

This API is part of the Natively platform. See main project license for details.
