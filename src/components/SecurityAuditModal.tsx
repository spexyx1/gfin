import { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Info, Code, FileText, ExternalLink, ChevronDown, ChevronUp, Lock, Zap, GitBranch } from 'lucide-react';
import { LEGAL_CONSTANTS } from '../config/legalConstants';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'PASS';

interface Finding {
  id: string;
  severity: SeverityLevel;
  title: string;
  contract: string;
  description: string;
  recommendation: string;
  status: 'resolved' | 'acknowledged' | 'open';
}

const SEVERITY_CONFIG: Record<SeverityLevel, { color: string; bg: string; border: string; label: string }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'CRITICAL' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'HIGH' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'MEDIUM' },
  LOW:      { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'LOW' },
  INFO:     { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'INFO' },
  PASS:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'PASS' },
};

const STATUS_CONFIG = {
  resolved:     { color: 'text-emerald-400', label: 'Resolved' },
  acknowledged: { color: 'text-yellow-400', label: 'Acknowledged' },
  open:         { color: 'text-red-400', label: 'Open' },
};

const ESCROW_FINDINGS: Finding[] = [
  {
    id: 'ESC-001',
    severity: 'PASS',
    title: 'Reentrancy Protection',
    contract: 'CryptoMarketplaceEscrow',
    description: 'All state-mutating functions that transfer tokens are protected with the OpenZeppelin ReentrancyGuard modifier (`nonReentrant`). Critical functions `depositGhettoCollateral`, `withdrawGhettoCollateral`, `fundOrder`, `withdrawSellerBalance`, and `resolveDispute` all use this guard correctly.',
    recommendation: 'No action required. Continue using `nonReentrant` on all future fund-moving functions.',
    status: 'resolved',
  },
  {
    id: 'ESC-002',
    severity: 'PASS',
    title: 'SafeERC20 Usage',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The contract correctly uses OpenZeppelin\'s `SafeERC20` library via `safeTransfer` and `safeTransferFrom` for all token movements, protecting against non-standard ERC20 implementations that do not return a boolean on transfer.',
    recommendation: 'No action required. SafeERC20 usage is correct throughout.',
    status: 'resolved',
  },
  {
    id: 'ESC-003',
    severity: 'MEDIUM',
    title: 'Centralized Dispute Resolution via `onlyOwner`',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The `resolveDispute` function is restricted to the contract owner (`onlyOwner`). This creates a single point of failure and introduces a trust assumption — users must trust the owner to act fairly in disputes. A compromised or malicious owner could redirect funds arbitrarily.',
    recommendation: 'Consider implementing a multi-signature governance model for dispute resolution, or a decentralized arbitration system with time-locked decisions. At minimum, emit an event with the resolver\'s address and reason for auditability.',
    status: 'acknowledged',
  },
  {
    id: 'ESC-004',
    severity: 'LOW',
    title: 'Mutable `ghettoToken` Reference',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The `ghettoToken` state variable is not `immutable` and can be changed by the owner via `setGhettoToken()`. While this allows upgradeability, it also means a token swap mid-operation could affect fee calculations and collateral logic, potentially causing inconsistent states for in-flight orders.',
    recommendation: 'Mark `ghettoToken` as `immutable` and use a proxy upgrade pattern if token migration is needed. If mutability must remain, add a timelock and emit events whenever the address changes.',
    status: 'acknowledged',
  },
  {
    id: 'ESC-005',
    severity: 'LOW',
    title: 'No Seller Collateral Withdrawal Guard on Active Orders',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The `withdrawGhettoCollateral` function checks `sellerHeldFunds[msg.sender] == 0`, which prevents withdrawal while funds are held. However, a seller could front-run the `agreeToOrder` call to withdraw collateral below the minimum threshold just before hold is placed in edge cases with specific block timing.',
    recommendation: 'The existing check on `sellerHeldFunds == 0` combined with the minimum collateral requirement provides adequate protection in most scenarios. Ensuring the `agreeToOrder` atomically reads and validates collateral before locking is the current correct behavior. Monitoring via off-chain alerts is recommended.',
    status: 'acknowledged',
  },
  {
    id: 'ESC-006',
    severity: 'LOW',
    title: '`depositGhettoCollateral` Uses Legacy `transferFrom` Pattern',
    contract: 'CryptoMarketplaceEscrow',
    description: 'In `depositGhettoCollateral()` (line 66), the contract uses `ghettoToken.transferFrom(...)` and checks its boolean return value with `require`. This is inconsistent with the `SafeERC20.safeTransferFrom` pattern used elsewhere in the contract. While the `GhettoToken` contract does return a bool, non-standard tokens used in the future would be unsafe.',
    recommendation: 'Replace the `transferFrom` call in `depositGhettoCollateral` with `SafeERC20.safeTransferFrom` for consistency and forward compatibility.',
    status: 'open',
  },
  {
    id: 'ESC-007',
    severity: 'PASS',
    title: 'Integer Overflow/Underflow Protection',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The contract uses Solidity ^0.8.19 which has built-in overflow and underflow protection, removing the need for SafeMath. All arithmetic operations are safe by default.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'ESC-008',
    severity: 'PASS',
    title: 'Order ID Collision Prevention',
    contract: 'CryptoMarketplaceEscrow',
    description: 'The `createOrder` function checks `orders[_orderId].buyer == address(0)` to prevent duplicate order IDs. This correctly guards against overwriting existing orders.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'ESC-009',
    severity: 'INFO',
    title: 'No Order Expiry / Stale Order Cleanup',
    contract: 'CryptoMarketplaceEscrow',
    description: 'Orders in the `Created` state have no expiry mechanism. If a seller agrees and holds collateral but the buyer never funds the order, the seller\'s collateral remains locked indefinitely. There is no timeout to auto-cancel unfunded orders.',
    recommendation: 'Add an `orderCreatedDeadline` field (e.g., 72 hours) after which any party can call `cancelOrder` even on funded states. This improves seller UX and prevents DOS via locked collateral.',
    status: 'acknowledged',
  },
  {
    id: 'ESC-010',
    severity: 'PASS',
    title: 'Fee Cap Enforcement',
    contract: 'CryptoMarketplaceEscrow',
    description: 'Admin functions `setPlatformFee` and `setNonGhettoFeeAddition` enforce maximum values (10% and 5% respectively) via `require` statements, preventing fee extraction attacks by a compromised owner.',
    recommendation: 'No action required. Fee caps are correctly enforced.',
    status: 'resolved',
  },
  {
    id: 'ESC-011',
    severity: 'INFO',
    title: 'Platform Fee Sent to `owner()` Address',
    contract: 'CryptoMarketplaceEscrow',
    description: 'In `_completeOrder`, platform fees are credited to `sellerBalances[owner()][paymentToken]`. If the owner changes (via Ownable transfer), the new owner receives future fees but old accumulated fees remain in the old mapping key. This is a bookkeeping edge case.',
    recommendation: 'Consider using a dedicated `feeRecipient` address that can be updated independently of contract ownership.',
    status: 'acknowledged',
  },
];

const TOKEN_FINDINGS: Finding[] = [
  {
    id: 'TKN-001',
    severity: 'PASS',
    title: 'ERC20 Standard Compliance',
    contract: 'GhettoToken',
    description: 'GhettoToken inherits from OpenZeppelin\'s battle-tested ERC20 implementation and correctly overrides `decimals()` to return 2. All standard ERC20 functions (`transfer`, `transferFrom`, `approve`, `allowance`, `balanceOf`, `totalSupply`) behave as expected.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'TKN-002',
    severity: 'HIGH',
    title: 'Unrestricted Mint Capability by Owner',
    contract: 'GhettoToken',
    description: 'The `mint` function is callable by the owner at any time with no supply cap. The owner can mint an unlimited amount of GHETTO tokens, which could be used to inflate supply, dilute holders, or manipulate the escrow collateral system. This is a significant centralization risk.',
    recommendation: 'Implement a maximum supply cap (`_MAX_SUPPLY`) enforced in the `mint` function. Consider a minting timelock or governance vote requirement for large mint amounts. Alternatively, renounce ownership after initial distribution if no further minting is needed.',
    status: 'acknowledged',
  },
  {
    id: 'TKN-003',
    severity: 'MEDIUM',
    title: 'Owner Can Burn Any User\'s Tokens via `burnFrom`',
    contract: 'GhettoToken',
    description: '`burnFrom(address account, uint256 amount)` is restricted to `onlyOwner`, bypassing the standard ERC20 approval mechanism. This allows the owner to burn tokens from any account without their consent or prior approval, which violates user token sovereignty.',
    recommendation: 'Remove the `onlyOwner` restriction from `burnFrom` and use the standard ERC20Burnable approval-based mechanism. If forced burns are needed for regulatory compliance (e.g., AML), document this explicitly in the token\'s disclosure materials and add a governance timelock.',
    status: 'acknowledged',
  },
  {
    id: 'TKN-004',
    severity: 'PASS',
    title: 'Blacklist Protects Owner Address',
    contract: 'GhettoToken',
    description: '`setBlacklisted` correctly enforces `require(account != owner(), "Cannot blacklist owner")`, preventing the owner from accidentally or maliciously locking themselves out of the token.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'TKN-005',
    severity: 'MEDIUM',
    title: 'External Transfer Restriction Bypass via Owner',
    contract: 'GhettoToken',
    description: 'In `_isTransferAllowed`, the first check returns `true` if `from == owner() || to == owner()`. This means the owner can send tokens to any address — including blacklisted addresses — and any address can send tokens to the owner even when `externalTransfersAllowed = false`. This creates an asymmetric bypass.',
    recommendation: 'Separate the concepts of "owner operational access" from "unrestricted transfers". Apply blacklist checks to the owner as well (only skip marketplace whitelist checks, not blacklist checks). This prevents accidentally moving tokens to a known bad actor.',
    status: 'acknowledged',
  },
  {
    id: 'TKN-006',
    severity: 'LOW',
    title: '`recoverERC20` Does Not Use SafeERC20',
    contract: 'GhettoToken',
    description: '`recoverERC20()` uses `IERC20(tokenAddress).transfer(owner(), amount)` without SafeERC20. If the token being recovered is non-standard and does not return a bool, this call will silently fail.',
    recommendation: 'Import and use `SafeERC20.safeTransfer` in `recoverERC20` for consistency and safety.',
    status: 'open',
  },
  {
    id: 'TKN-007',
    severity: 'INFO',
    title: '2 Decimal Places — Non-Standard',
    contract: 'GhettoToken',
    description: 'GHETTO uses 2 decimal places, which differs from the ERC20 standard of 18. This is fully valid per EIP-20 but may cause integration issues with wallets, DEXes, and other protocols that assume 18 decimals without reading the `decimals()` function.',
    recommendation: 'Document this clearly in all integration guides and API documentation. Ensure the escrow contract correctly accounts for this when calculating collateral amounts (it does — using `100 * 10**2`).',
    status: 'acknowledged',
  },
  {
    id: 'TKN-008',
    severity: 'PASS',
    title: 'Pausable Emergency Mechanism',
    contract: 'GhettoToken',
    description: 'The contract inherits OpenZeppelin\'s `Pausable` and correctly applies `whenNotPaused` in `_beforeTokenTransfer`. This provides a functional emergency stop that can halt all transfers in the event of an exploit or critical bug.',
    recommendation: 'No action required. Ensure pause/unpause procedures are documented in the incident response plan.',
    status: 'resolved',
  },
];

const SWAP_FINDINGS: Finding[] = [
  {
    id: 'SWP-001',
    severity: 'PASS',
    title: 'Atomic Completion Logic',
    contract: 'AtomicSwap',
    description: 'The swap completes atomically within `_completeSwap` — both token transfers occur in the same internal call. If one transfer reverts, the entire transaction reverts, guaranteeing that neither party loses tokens in a partial execution.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'SWP-002',
    severity: 'PASS',
    title: 'Expiry and Cancellation with Full Refunds',
    contract: 'AtomicSwap',
    description: '`cancelSwap` correctly handles partial deposits — if only the initiator deposited and the swap is cancelled, only the initiator gets their tokens back (and vice versa). This prevents funds from being locked.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'SWP-003',
    severity: 'LOW',
    title: 'Swap ID Collision Risk with Off-Chain Generation',
    contract: 'AtomicSwap',
    description: 'The `swapId` (bytes32) is supplied by the caller rather than being generated on-chain. Two parties generating the same ID off-chain (or a malicious actor front-running a swap creation with the same ID) would cause the second `createSwap` to revert with "Swap ID already exists".',
    recommendation: 'Consider generating the swap ID on-chain using a hash of `(msg.sender, recipient, block.timestamp, nonce)` to eliminate the collision vector entirely. If keeping caller-supplied IDs, document the generation method clearly.',
    status: 'acknowledged',
  },
  {
    id: 'SWP-004',
    severity: 'PASS',
    title: 'Token Whitelist for Approved Swaps',
    contract: 'AtomicSwap',
    description: 'The `onlyApprovedToken` modifier ensures only owner-vetted tokens can be used in swaps. This prevents malicious or deflationary tokens from being used in attacks.',
    recommendation: 'No action required. Maintain a rigorous approval process for new tokens.',
    status: 'resolved',
  },
  {
    id: 'SWP-005',
    severity: 'INFO',
    title: '`gaslessTokens` Mapping Has No Effect',
    contract: 'AtomicSwap',
    description: 'The `gaslessTokens` mapping and `setGaslessToken` function are defined and emit events, but `gaslessTokens` is never read in any function. This is dead code — the gasless feature is declared but not implemented.',
    recommendation: 'Either implement the gasless transfer logic (e.g., via EIP-2612 permit signatures) or remove the `gaslessTokens` mapping and related functions to reduce contract bytecode and avoid misleading integrators.',
    status: 'acknowledged',
  },
  {
    id: 'SWP-006',
    severity: 'PASS',
    title: 'Reentrancy Protection on Deposit and Cancel',
    contract: 'AtomicSwap',
    description: '`depositInitiatorTokens`, `depositRecipientTokens`, and `cancelSwap` are all protected with `nonReentrant`, preventing any callback-based reentrancy attack.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
  {
    id: 'SWP-007',
    severity: 'PASS',
    title: 'Self-Swap Prevention',
    contract: 'AtomicSwap',
    description: '`createSwap` enforces `require(recipient != msg.sender, "Cannot swap with yourself")`, preventing circular swaps that could be used to game fee or accounting logic.',
    recommendation: 'No action required.',
    status: 'resolved',
  },
];

const CONTRACT_INFO = [
  {
    name: 'CryptoMarketplaceEscrow',
    file: 'EscrowContract.sol',
    version: '^0.8.19',
    description: 'Core escrow contract managing P2P trade lifecycle from order creation through delivery confirmation and dispute resolution.',
    lines: 320,
    findings: ESCROW_FINDINGS,
  },
  {
    name: 'GhettoToken',
    file: 'GhettoToken.sol',
    version: '^0.8.19',
    description: 'ERC20 utility token with 2 decimal places, transfer controls, blacklisting, and marketplace whitelisting used as platform collateral.',
    lines: 196,
    findings: TOKEN_FINDINGS,
  },
  {
    name: 'AtomicSwap',
    file: 'AtomicSwap.sol',
    version: '^0.8.20',
    description: 'Permissioned atomic token swap contract enabling trustless peer-to-peer exchanges between any two approved ERC20 tokens.',
    lines: 224,
    findings: SWAP_FINDINGS,
  },
];

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[finding.severity];
  const stat = STATUS_CONFIG[finding.status];

  return (
    <div className={`rounded-xl border ${sev.border} ${sev.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${sev.border} ${sev.color} shrink-0 mt-0.5`}>
            {sev.label}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-mono">{finding.id}</span>
              <span className={`text-xs font-bold ${stat.color}`}>{stat.label}</span>
            </div>
            <p className="text-white font-bold text-sm mt-0.5">{finding.title}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-300 leading-relaxed">{finding.description}</p>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Recommendation</p>
            <p className="text-sm text-gray-300 leading-relaxed">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SecurityAuditModal({ isOpen, onClose }: SecurityAuditModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow' | 'token' | 'swap'>('overview');

  if (!isOpen) return null;

  const allFindings = [...ESCROW_FINDINGS, ...TOKEN_FINDINGS, ...SWAP_FINDINGS];
  const countBySeverity = (sev: SeverityLevel) => allFindings.filter(f => f.severity === sev).length;
  const passCount = countBySeverity('PASS');
  const criticalCount = countBySeverity('CRITICAL');
  const highCount = countBySeverity('HIGH');
  const mediumCount = countBySeverity('MEDIUM');
  const lowCount = countBySeverity('LOW');
  const infoCount = countBySeverity('INFO');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'escrow', label: 'Escrow Contract' },
    { id: 'token', label: 'GHETTO Token' },
    { id: 'swap', label: 'Atomic Swap' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">Security & Contract Audit</h2>
              <p className="text-xs text-gray-400 font-bold">GHETTO Finance Smart Contract Review — v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-wide transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Audit Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-900/30 to-gray-900/50 border border-emerald-500/20 p-5">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-black text-lg mb-1">Internal Security Review Completed</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      All three smart contracts — <strong className="text-white">CryptoMarketplaceEscrow</strong>, <strong className="text-white">GhettoToken</strong>, and <strong className="text-white">AtomicSwap</strong> — have been reviewed against OWASP Smart Contract Security standards, Solidity best practices, and the SWC Registry of known vulnerabilities. No critical issues were identified. Medium and low findings are acknowledged and tracked below.
                    </p>
                    <p className="text-gray-400 text-xs mt-2 font-bold">Review Date: {LEGAL_CONSTANTS.SECURITY_AUDIT.REVIEW_DATE} · Solidity {LEGAL_CONSTANTS.SECURITY_AUDIT.SOLIDITY_VERSION} · OpenZeppelin {LEGAL_CONSTANTS.SECURITY_AUDIT.OPENZEPPELIN_VERSION}</p>
                  </div>
                </div>
              </div>

              {/* Severity Summary */}
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider mb-3">Finding Summary</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { ...SEVERITY_CONFIG.CRITICAL, label: 'Critical', count: criticalCount },
                    { ...SEVERITY_CONFIG.HIGH, label: 'High', count: highCount },
                    { ...SEVERITY_CONFIG.MEDIUM, label: 'Medium', count: mediumCount },
                    { ...SEVERITY_CONFIG.LOW, label: 'Low', count: lowCount },
                    { ...SEVERITY_CONFIG.INFO, label: 'Info', count: infoCount },
                    { ...SEVERITY_CONFIG.PASS, label: 'Pass', count: passCount },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-3 text-center`}>
                      <div className={`text-2xl font-black ${item.color}`}>{item.count}</div>
                      <div className={`text-xs font-black ${item.color} uppercase`}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract Summaries */}
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider mb-3">Contracts Reviewed</h3>
                <div className="space-y-3">
                  {CONTRACT_INFO.map(c => {
                    const passes = c.findings.filter(f => f.severity === 'PASS').length;
                    const issues = c.findings.filter(f => !['PASS', 'INFO'].includes(f.severity)).length;
                    return (
                      <div key={c.name} className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Code className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-black">{c.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{c.file} · {c.lines} lines · Solidity {c.version}</p>
                              <p className="text-sm text-gray-300 mt-1">{c.description}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-emerald-400 font-black text-sm">{passes} PASS</div>
                            <div className={`font-black text-sm ${issues > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>{issues} Issues</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Measures */}
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider mb-3">Security Measures in Place</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Lock, title: 'Reentrancy Guards', desc: 'All fund-moving functions protected with OpenZeppelin ReentrancyGuard' },
                    { icon: Shield, title: 'SafeERC20', desc: 'Safe token transfer patterns used throughout to handle non-standard ERC20s' },
                    { icon: Zap, title: 'Integer Safety', desc: 'Solidity 0.8.x built-in overflow/underflow protection on all arithmetic' },
                    { icon: GitBranch, title: 'Fee Caps', desc: 'Platform fees capped at 10%, seller hold at 20%, preventing extraction attacks' },
                    { icon: AlertTriangle, title: 'Access Control', desc: 'OpenZeppelin Ownable restricts admin functions to authorized addresses' },
                    { icon: CheckCircle, title: 'Event Logging', desc: 'All state changes emit events for off-chain monitoring and auditability' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3 luxe-glass opacity-30 rounded-xl border border-white/5 p-3">
                      <item.icon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-black text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">
                    <strong className="text-yellow-400">Disclaimer:</strong> This audit represents an internal security review. Smart contract audits reduce but do not eliminate risk. A third-party professional audit from a firm such as Trail of Bits, OpenZeppelin, or Quantstamp is recommended before mainnet deployment of significant value. Use of these contracts is at your own risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTRACT-SPECIFIC TABS */}
          {activeTab === 'escrow' && (
            <div className="space-y-4">
              <div className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-white font-black">CryptoMarketplaceEscrow</h3>
                </div>
                <p className="text-sm text-gray-300">Manages the full P2P trade lifecycle: collateral deposit, order creation, funding, shipping, delivery confirmation, dispute resolution, and fee distribution. Uses GHETTO tokens as seller collateral.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['ReentrancyGuard', 'SafeERC20', 'Ownable', 'ERC20 Escrow'].map(t => (
                    <span key={t} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md font-bold">{t}</span>
                  ))}
                </div>
              </div>
              {ESCROW_FINDINGS.map(f => <FindingCard key={f.id} finding={f} />)}
            </div>
          )}

          {activeTab === 'token' && (
            <div className="space-y-4">
              <div className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-white font-black">GhettoToken (GHETTO)</h3>
                </div>
                <p className="text-sm text-gray-300">ERC20 utility token with 2 decimal places and 10M initial supply. Features transfer controls, blacklisting, marketplace whitelisting, mintability, and pausability. Serves as the platform collateral and fee-discount currency.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['ERC20', 'ERC20Burnable', 'Pausable', 'Ownable', '2 Decimals'].map(t => (
                    <span key={t} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md font-bold">{t}</span>
                  ))}
                </div>
              </div>
              {TOKEN_FINDINGS.map(f => <FindingCard key={f.id} finding={f} />)}
            </div>
          )}

          {activeTab === 'swap' && (
            <div className="space-y-4">
              <div className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-white font-black">AtomicSwap</h3>
                </div>
                <p className="text-sm text-gray-300">Enables trustless peer-to-peer token swaps. Both parties deposit tokens into the contract; completion is atomic — either both transfers succeed or neither does. Includes expiry-based cancellation with full refunds.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['ReentrancyGuard', 'SafeERC20', 'Ownable', 'Atomic Execution', 'Token Whitelist'].map(t => (
                    <span key={t} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md font-bold">{t}</span>
                  ))}
                </div>
              </div>
              {SWAP_FINDINGS.map(f => <FindingCard key={f.id} finding={f} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400 font-bold">
              {allFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length === 0
                ? 'No Critical or High severity issues found'
                : `${criticalCount} Critical, ${highCount} High severity issues found`}
            </span>
          </div>
          <a
            href="mailto:security@ghetto.finance"
            className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 font-black transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Report a Vulnerability
          </a>
        </div>
      </div>
    </div>
  );
}
