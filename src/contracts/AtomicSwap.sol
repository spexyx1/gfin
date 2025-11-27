// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AtomicSwap is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Swap {
        address initiator;
        address recipient;
        address initiatorToken;
        address recipientToken;
        uint256 initiatorAmount;
        uint256 recipientAmount;
        uint256 expiresAt;
        bool initiatorDeposited;
        bool recipientDeposited;
        bool completed;
        bool cancelled;
    }

    mapping(bytes32 => Swap) public swaps;
    mapping(address => bool) public approvedTokens;
    mapping(address => bool) public gaslessTokens;

    event SwapCreated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed recipient,
        address initiatorToken,
        address recipientToken,
        uint256 initiatorAmount,
        uint256 recipientAmount,
        uint256 expiresAt
    );

    event TokenDeposited(bytes32 indexed swapId, address indexed depositor, uint256 amount);
    event SwapCompleted(bytes32 indexed swapId);
    event SwapCancelled(bytes32 indexed swapId);
    event TokenApproved(address indexed token, bool approved);
    event GaslessEnabled(address indexed token, bool enabled);

    modifier onlyApprovedToken(address token) {
        require(approvedTokens[token], "Token not approved");
        _;
    }

    modifier swapExists(bytes32 swapId) {
        require(swaps[swapId].initiator != address(0), "Swap does not exist");
        _;
    }

    modifier swapNotExpired(bytes32 swapId) {
        require(block.timestamp <= swaps[swapId].expiresAt, "Swap expired");
        _;
    }

    modifier swapNotCompleted(bytes32 swapId) {
        require(!swaps[swapId].completed, "Swap already completed");
        require(!swaps[swapId].cancelled, "Swap cancelled");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function approveToken(address token, bool approved) external onlyOwner {
        approvedTokens[token] = approved;
        emit TokenApproved(token, approved);
    }

    function setGaslessToken(address token, bool enabled) external onlyOwner {
        gaslessTokens[token] = enabled;
        emit GaslessEnabled(token, enabled);
    }

    function createSwap(
        bytes32 swapId,
        address recipient,
        address initiatorToken,
        address recipientToken,
        uint256 initiatorAmount,
        uint256 recipientAmount,
        uint256 duration
    )
        external
        nonReentrant
        onlyApprovedToken(initiatorToken)
        onlyApprovedToken(recipientToken)
    {
        require(swaps[swapId].initiator == address(0), "Swap ID already exists");
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot swap with yourself");
        require(initiatorAmount > 0, "Invalid initiator amount");
        require(recipientAmount > 0, "Invalid recipient amount");
        require(duration > 0 && duration <= 7 days, "Invalid duration");

        swaps[swapId] = Swap({
            initiator: msg.sender,
            recipient: recipient,
            initiatorToken: initiatorToken,
            recipientToken: recipientToken,
            initiatorAmount: initiatorAmount,
            recipientAmount: recipientAmount,
            expiresAt: block.timestamp + duration,
            initiatorDeposited: false,
            recipientDeposited: false,
            completed: false,
            cancelled: false
        });

        emit SwapCreated(
            swapId,
            msg.sender,
            recipient,
            initiatorToken,
            recipientToken,
            initiatorAmount,
            recipientAmount,
            block.timestamp + duration
        );
    }

    function depositInitiatorTokens(bytes32 swapId)
        external
        nonReentrant
        swapExists(swapId)
        swapNotExpired(swapId)
        swapNotCompleted(swapId)
    {
        Swap storage swap = swaps[swapId];
        require(msg.sender == swap.initiator, "Only initiator can deposit");
        require(!swap.initiatorDeposited, "Already deposited");

        IERC20(swap.initiatorToken).safeTransferFrom(
            msg.sender,
            address(this),
            swap.initiatorAmount
        );

        swap.initiatorDeposited = true;
        emit TokenDeposited(swapId, msg.sender, swap.initiatorAmount);

        if (swap.recipientDeposited) {
            _completeSwap(swapId);
        }
    }

    function depositRecipientTokens(bytes32 swapId)
        external
        nonReentrant
        swapExists(swapId)
        swapNotExpired(swapId)
        swapNotCompleted(swapId)
    {
        Swap storage swap = swaps[swapId];
        require(msg.sender == swap.recipient, "Only recipient can deposit");
        require(!swap.recipientDeposited, "Already deposited");

        IERC20(swap.recipientToken).safeTransferFrom(
            msg.sender,
            address(this),
            swap.recipientAmount
        );

        swap.recipientDeposited = true;
        emit TokenDeposited(swapId, msg.sender, swap.recipientAmount);

        if (swap.initiatorDeposited) {
            _completeSwap(swapId);
        }
    }

    function _completeSwap(bytes32 swapId) internal {
        Swap storage swap = swaps[swapId];

        IERC20(swap.initiatorToken).safeTransfer(swap.recipient, swap.initiatorAmount);
        IERC20(swap.recipientToken).safeTransfer(swap.initiator, swap.recipientAmount);

        swap.completed = true;
        emit SwapCompleted(swapId);
    }

    function cancelSwap(bytes32 swapId)
        external
        nonReentrant
        swapExists(swapId)
        swapNotCompleted(swapId)
    {
        Swap storage swap = swaps[swapId];
        require(
            msg.sender == swap.initiator ||
            msg.sender == swap.recipient ||
            block.timestamp > swap.expiresAt,
            "Not authorized to cancel"
        );

        if (swap.initiatorDeposited) {
            IERC20(swap.initiatorToken).safeTransfer(swap.initiator, swap.initiatorAmount);
        }

        if (swap.recipientDeposited) {
            IERC20(swap.recipientToken).safeTransfer(swap.recipient, swap.recipientAmount);
        }

        swap.cancelled = true;
        emit SwapCancelled(swapId);
    }

    function getSwap(bytes32 swapId) external view returns (Swap memory) {
        return swaps[swapId];
    }

    function isTokenApproved(address token) external view returns (bool) {
        return approvedTokens[token];
    }

    function isGaslessToken(address token) external view returns (bool) {
        return gaslessTokens[token];
    }
}
