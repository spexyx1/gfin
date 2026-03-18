import React, { useState } from 'react';
import { Book, Code, Key, Webhook, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function MerchantAPIDocs() {
  const [activeTab, setActiveTab] = useState('overview');

  const baseUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    : 'https://your-project.supabase.co/functions/v1';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-4xl font-bold mb-4">Merchant API Documentation</h1>
        <p className="text-gray-600 text-lg">
          Integrate Natively's secure non-custodial escrow system into your applications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 sticky top-6">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Book },
                { id: 'authentication', label: 'Authentication', icon: Key },
                { id: 'orders', label: 'Orders API', icon: Code },
                { id: 'webhooks', label: 'Webhooks', icon: Webhook },
                { id: 'disputes', label: 'Disputes', icon: AlertCircle },
                { id: 'sdk', label: 'SDK Usage', icon: Code },
                { id: 'security', label: 'Security', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-orange-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-8 prose max-w-none">
            {activeTab === 'overview' && (
              <div>
                <h2>Overview</h2>
                <p>
                  The Natively Merchant API allows you to integrate our secure, non-custodial
                  escrow system into your external applications. The API provides complete control
                  over order creation, payment tracking, and dispute management.
                </p>

                <h3>Key Features</h3>
                <ul>
                  <li>Non-custodial blockchain escrow with smart contracts</li>
                  <li>Per-transaction fee model with customizable rates</li>
                  <li>7-day buyer protection with early release option</li>
                  <li>Automated webhook notifications for order events</li>
                  <li>Built-in dispute resolution and mediation system</li>
                  <li>Support for multiple cryptocurrencies (ETH, USDC, USDT, GHETTO)</li>
                </ul>

                <h3>Base URL</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">{baseUrl}</code>
                </div>

                <h3>Supported Environments</h3>
                <ul>
                  <li><strong>Sandbox:</strong> Test environment with fake transactions</li>
                  <li><strong>Production:</strong> Live environment with real blockchain transactions</li>
                </ul>
              </div>
            )}

            {activeTab === 'authentication' && (
              <div>
                <h2>Authentication</h2>
                <p>
                  All API requests require authentication using API keys. Include your API key
                  in the request headers:
                </p>

                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
{`X-API-Key: mk_test_your_api_key_here`}
                  </pre>
                </div>

                <h3>API Key Types</h3>
                <ul>
                  <li><code>mk_test_*</code> - Sandbox keys for testing</li>
                  <li><code>mk_live_*</code> - Production keys for live transactions</li>
                </ul>

                <h3>Rate Limits</h3>
                <p>
                  API keys have rate limits based on your account settings:
                </p>
                <ul>
                  <li>Default: 10,000 requests per day</li>
                  <li>Hourly limit: Daily limit / 24</li>
                  <li>Rate limit headers are included in responses</li>
                </ul>

                <h3>Error Responses</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
{`{
  "error": "Invalid API key",
  "errorCode": "INVALID_API_KEY"
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2>Orders API</h2>

                <h3>Create Order</h3>
                <p>Create a new order with escrow protection.</p>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`POST ${baseUrl}/merchant-api-orders

{
  "merchant_reference_id": "order-12345",
  "buyer_wallet_address": "0x1234...5678",
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
}`}
                  </pre>
                </div>

                <h3>Get Order</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`GET ${baseUrl}/merchant-api-orders/:order_id`}
                  </pre>
                </div>

                <h3>List Orders</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`GET ${baseUrl}/merchant-api-orders?status=pending&limit=50&offset=0`}
                  </pre>
                </div>

                <h3>Mark Order Shipped</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`POST ${baseUrl}/merchant-api-orders/:order_id/ship

{
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com",
  "carrier": "UPS"
}`}
                  </pre>
                </div>

                <h3>Update Tracking</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`PATCH ${baseUrl}/merchant-api-orders/:order_id/tracking

{
  "tracking_number": "1Z999AA10123456784",
  "tracking_url": "https://tracking.example.com"
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div>
                <h2>Webhooks</h2>
                <p>
                  Webhooks allow you to receive real-time notifications about events in your
                  merchant account. Configure your webhook endpoint in the merchant dashboard.
                </p>

                <h3>Webhook Events</h3>
                <ul>
                  <li><code>order.created</code> - New order created</li>
                  <li><code>order.funded</code> - Order payment received on blockchain</li>
                  <li><code>order.shipped</code> - Order marked as shipped</li>
                  <li><code>order.delivered</code> - Buyer confirmed delivery</li>
                  <li><code>order.completed</code> - Funds released to seller</li>
                  <li><code>order.disputed</code> - Buyer raised a dispute</li>
                  <li><code>dispute.resolved</code> - Dispute resolved by mediator</li>
                  <li><code>payment.received</code> - Payment detected on blockchain</li>
                </ul>

                <h3>Webhook Payload</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`{
  "event_type": "order.created",
  "event_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "uuid",
    "merchant_reference_id": "order-12345",
    "status": "pending",
    "amount": 100.50,
    "payment_token": "ETH"
  }
}`}
                  </pre>
                </div>

                <h3>Webhook Signature Verification</h3>
                <p>
                  All webhooks include an <code>X-Webhook-Signature</code> header with an
                  HMAC-SHA256 signature. Verify this signature to ensure the webhook is authentic.
                </p>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const computed = hmac.update(payload).digest('hex');
  return computed === signature;
}`}
                  </pre>
                </div>

                <h3>Retry Logic</h3>
                <p>Failed webhook deliveries are automatically retried with exponential backoff:</p>
                <ul>
                  <li>Attempt 1: Immediate</li>
                  <li>Attempt 2: After 1 minute</li>
                  <li>Attempt 3: After 5 minutes</li>
                  <li>Attempt 4: After 15 minutes</li>
                  <li>Attempt 5: After 1 hour</li>
                </ul>
              </div>
            )}

            {activeTab === 'disputes' && (
              <div>
                <h2>Disputes API</h2>

                <h3>Get Order Disputes</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`GET ${baseUrl}/merchant-api-disputes/orders/:order_id`}
                  </pre>
                </div>

                <h3>Get Dispute Details</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`GET ${baseUrl}/merchant-api-disputes/disputes/:dispute_id`}
                  </pre>
                </div>

                <h3>List All Disputes</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`GET ${baseUrl}/merchant-api-disputes?status=open&limit=50`}
                  </pre>
                </div>

                <h3>Add Evidence</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`POST ${baseUrl}/merchant-api-disputes/disputes/:dispute_id/evidence

{
  "evidence_type": "photo",
  "description": "Product packaging with tracking label",
  "file_url": "https://storage.example.com/evidence.jpg"
}`}
                  </pre>
                </div>

                <h3>Add Comment</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`POST ${baseUrl}/merchant-api-disputes/disputes/:dispute_id/comments

{
  "comment": "Package was delivered on time with signature confirmation"
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'sdk' && (
              <div>
                <h2>TypeScript SDK</h2>
                <p>
                  Use our official TypeScript SDK for type-safe API integration.
                </p>

                <h3>Installation</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`import MerchantSDK from './lib/merchantSDK';

const sdk = new MerchantSDK({
  apiKey: 'mk_test_your_key_here',
  environment: 'sandbox'
});`}
                  </pre>
                </div>

                <h3>Create Order</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`const order = await sdk.createOrder({
  merchant_reference_id: 'order-12345',
  buyer_wallet_address: '0x1234...5678',
  product_id: 'uuid',
  quantity: 1,
  payment_token: 'ETH'
});

console.log('Order created:', order.id);`}
                  </pre>
                </div>

                <h3>Get Order</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`const order = await sdk.getOrder('order-uuid');
console.log('Order status:', order.status);`}
                  </pre>
                </div>

                <h3>Mark Shipped</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`await sdk.markOrderShipped('order-uuid', {
  tracking_number: '1Z999AA10123456784',
  tracking_url: 'https://tracking.example.com',
  carrier: 'UPS'
});`}
                  </pre>
                </div>

                <h3>Error Handling</h3>
                <div className="luxe-glass-strong text-gray-100 p-4 rounded-lg mb-4">
                  <pre className="text-sm overflow-x-auto">
{`try {
  const order = await sdk.createOrder({...});
} catch (error) {
  if (error instanceof MerchantSDKError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.errorCode);
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2>Security Best Practices</h2>

                <h3>API Key Management</h3>
                <ul>
                  <li>Never expose API keys in client-side code or public repositories</li>
                  <li>Store keys securely in environment variables</li>
                  <li>Use different keys for sandbox and production</li>
                  <li>Rotate keys regularly and when team members leave</li>
                  <li>Revoke compromised keys immediately</li>
                </ul>

                <h3>Webhook Security</h3>
                <ul>
                  <li>Always verify webhook signatures before processing</li>
                  <li>Use HTTPS endpoints for webhooks</li>
                  <li>Implement replay attack protection using event IDs</li>
                  <li>Set reasonable timeout values for webhook handlers</li>
                </ul>

                <h3>Data Protection</h3>
                <ul>
                  <li>Never store sensitive payment information</li>
                  <li>Use blockchain wallet addresses, not user credentials</li>
                  <li>Implement proper access controls in your application</li>
                  <li>Log API requests for audit purposes</li>
                  <li>Monitor for unusual activity patterns</li>
                </ul>

                <h3>IP Whitelisting</h3>
                <p>
                  Configure IP whitelisting in your merchant dashboard to restrict API access
                  to specific IP addresses.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Compliance</h4>
                      <p className="text-blue-800 text-sm">
                        This is a non-custodial system. Merchants are responsible for their own
                        KYC/AML compliance. We only facilitate the escrow smart contract interaction
                        and provide dispute mediation services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
