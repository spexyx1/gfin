// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CryptoMarketplaceEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;
    IERC20 public ghettoToken;

    enum OrderStatus { Created, Funded, Shipped, Delivered, AwaitingRelease, FundsReleased, Disputed, Completed, Cancelled }

    struct Order {
        string orderId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 sellerHoldAmount;
        address paymentToken;
        OrderStatus status;
        uint256 createdAt;
        uint256 deliveryDeadline;
        uint256 fundsReleaseDeadline;
        bool buyerConfirmed;
        bool sellerConfirmed;
        bool sellerAgreed;
    }

    mapping(string => Order) public orders;
    mapping(address => mapping(address => uint256)) public sellerBalances;
    mapping(address => uint256) public sellerGhettoCollateral;
    mapping(address => uint256) public sellerHeldFunds;

    uint256 public constant DELIVERY_WINDOW = 7 days;
    uint256 public constant FUNDS_RELEASE_WINDOW = 7 days;
    uint256 public constant REQUIRED_GHETTO_COLLATERAL = 100 * 10**2;
    uint256 public platformFeePercent = 250;
    uint256 public nonGhettoFeeAddition = 125;
    uint256 public sellerHoldPercent = 1000;

    event OrderCreated(string indexed orderId, address indexed buyer, address indexed seller, uint256 amount, address paymentToken);
    event SellerCollateralDeposited(address indexed seller, uint256 amount);
    event SellerCollateralWithdrawn(address indexed seller, uint256 amount);
    event SellerAgreed(string indexed orderId, uint256 holdAmount);
    event OrderFunded(string indexed orderId, uint256 amount, address paymentToken);
    event SellerFundsHeld(string indexed orderId, address indexed seller, uint256 amount);
    event SellerFundsReleased(string indexed orderId, address indexed seller, uint256 amount);
    event OrderShipped(string indexed orderId);
    event OrderDelivered(string indexed orderId);
    event OrderAwaitingRelease(string indexed orderId, uint256 releaseDeadline);
    event OrderCompleted(string indexed orderId);
    event OrderDisputed(string indexed orderId);
    event OrderCancelled(string indexed orderId);
    event FundsReleased(string indexed orderId, address indexed seller, uint256 amount, address token);

    constructor(address _usdcToken, address _ghettoToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        ghettoToken = IERC20(_ghettoToken);
    }

    function depositGhettoCollateral(uint256 _amount) external nonReentrant {
        require(_amount >= REQUIRED_GHETTO_COLLATERAL, "Minimum 100 GHETTO required");
        ghettoToken.safeTransferFrom(msg.sender, address(this), _amount);

        sellerGhettoCollateral[msg.sender] += _amount;
        emit SellerCollateralDeposited(msg.sender, _amount);
    }

    function withdrawGhettoCollateral(uint256 _amount) external nonReentrant {
        require(sellerGhettoCollateral[msg.sender] >= _amount, "Insufficient collateral");
        require(sellerHeldFunds[msg.sender] == 0, "Cannot withdraw while funds are held");
        require(
            sellerGhettoCollateral[msg.sender] - _amount >= REQUIRED_GHETTO_COLLATERAL,
            "Must maintain minimum collateral"
        );

        sellerGhettoCollateral[msg.sender] -= _amount;
        ghettoToken.safeTransfer(msg.sender, _amount);

        emit SellerCollateralWithdrawn(msg.sender, _amount);
    }

    function createOrder(
        string memory _orderId,
        address _seller,
        uint256 _amount,
        address _paymentToken
    ) external {
        require(orders[_orderId].buyer == address(0), "Order already exists");
        require(_seller != msg.sender, "Cannot create order with yourself");
        require(_amount > 0, "Amount must be greater than 0");
        require(sellerGhettoCollateral[_seller] >= REQUIRED_GHETTO_COLLATERAL, "Seller must have GHETTO collateral");

        uint256 maxOrderValue = sellerGhettoCollateral[_seller] - sellerHeldFunds[_seller];
        require(_amount <= maxOrderValue, "Order exceeds seller's available collateral limit");

        uint256 holdAmount = (_amount * sellerHoldPercent) / 10000;

        orders[_orderId] = Order({
            orderId: _orderId,
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            sellerHoldAmount: holdAmount,
            paymentToken: _paymentToken,
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            deliveryDeadline: 0,
            fundsReleaseDeadline: 0,
            buyerConfirmed: false,
            sellerConfirmed: false,
            sellerAgreed: false
        });

        emit OrderCreated(_orderId, msg.sender, _seller, _amount, _paymentToken);
    }

    function agreeToOrder(string memory _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.seller == msg.sender, "Only seller can agree to order");
        require(order.status == OrderStatus.Created, "Order already processed");
        require(!order.sellerAgreed, "Seller already agreed");

        require(sellerGhettoCollateral[msg.sender] >= order.amount, "Insufficient GHETTO collateral");
        uint256 availableCollateral = sellerGhettoCollateral[msg.sender] - sellerHeldFunds[msg.sender];
        require(availableCollateral >= order.amount, "Insufficient available collateral for hold");

        sellerHeldFunds[msg.sender] += order.amount;
        order.sellerAgreed = true;

        emit SellerAgreed(_orderId, order.amount);
        emit SellerFundsHeld(_orderId, msg.sender, order.amount);
    }

    function fundOrder(string memory _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Only buyer can fund order");
        require(order.status == OrderStatus.Created, "Order cannot be funded");
        require(order.sellerAgreed, "Seller must agree to order first");

        IERC20 paymentToken = IERC20(order.paymentToken);
        paymentToken.safeTransferFrom(msg.sender, address(this), order.amount);

        order.status = OrderStatus.Funded;
        emit OrderFunded(_orderId, order.amount, order.paymentToken);
    }

    function markAsShipped(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(order.seller == msg.sender, "Only seller can mark as shipped");
        require(order.status == OrderStatus.Funded, "Order must be funded first");

        order.status = OrderStatus.Shipped;
        order.deliveryDeadline = block.timestamp + DELIVERY_WINDOW;
        emit OrderShipped(_orderId);
    }

    function confirmDelivery(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Only buyer can confirm delivery");
        require(order.status == OrderStatus.Shipped, "Order must be shipped first");

        order.status = OrderStatus.AwaitingRelease;
        order.buyerConfirmed = true;
        order.fundsReleaseDeadline = block.timestamp + FUNDS_RELEASE_WINDOW;
        emit OrderDelivered(_orderId);
        emit OrderAwaitingRelease(_orderId, order.fundsReleaseDeadline);
    }

    function releaseFunds(string memory _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Only buyer can release funds");
        require(order.status == OrderStatus.AwaitingRelease, "Order must be in awaiting release state");

        _completeOrder(_orderId);
    }

    function autoReleaseFunds(string memory _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.AwaitingRelease, "Order must be in awaiting release state");
        require(block.timestamp > order.fundsReleaseDeadline, "Funds release window not expired");

        _completeOrder(_orderId);
    }

    function autoCompleteOrder(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Shipped, "Order must be shipped");
        require(block.timestamp > order.deliveryDeadline, "Delivery window not expired");

        order.status = OrderStatus.AwaitingRelease;
        order.fundsReleaseDeadline = block.timestamp + FUNDS_RELEASE_WINDOW;
        emit OrderDelivered(_orderId);
        emit OrderAwaitingRelease(_orderId, order.fundsReleaseDeadline);
    }

    function _completeOrder(string memory _orderId) internal {
        Order storage order = orders[_orderId];

        uint256 totalFeePercent = platformFeePercent;
        if (order.paymentToken != address(ghettoToken)) {
            totalFeePercent += nonGhettoFeeAddition;
        }

        uint256 platformFee = (order.amount * totalFeePercent) / 10000;
        uint256 sellerAmount = order.amount - platformFee;

        sellerBalances[order.seller][order.paymentToken] += sellerAmount;
        sellerBalances[owner()][order.paymentToken] += platformFee;

        sellerHeldFunds[order.seller] -= order.amount;

        order.status = OrderStatus.Completed;
        emit OrderCompleted(_orderId);
        emit FundsReleased(_orderId, order.seller, sellerAmount, order.paymentToken);
        emit SellerFundsReleased(_orderId, order.seller, order.amount);
    }

    function cancelOrder(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(
            order.buyer == msg.sender || order.seller == msg.sender,
            "Only buyer or seller can cancel"
        );
        require(order.status == OrderStatus.Created, "Can only cancel unfunded orders");

        if (order.sellerAgreed) {
            sellerHeldFunds[order.seller] -= order.amount;
            emit SellerFundsReleased(_orderId, order.seller, order.amount);
        }

        order.status = OrderStatus.Cancelled;
        emit OrderCancelled(_orderId);
    }

    function withdrawSellerBalance(address _token) external nonReentrant {
        uint256 balance = sellerBalances[msg.sender][_token];
        require(balance > 0, "No balance to withdraw");

        sellerBalances[msg.sender][_token] = 0;
        IERC20(_token).safeTransfer(msg.sender, balance);
    }

    function getAvailableCollateral(address seller) external view returns (uint256) {
        return sellerGhettoCollateral[seller] - sellerHeldFunds[seller];
    }

    function getSellerCollateral(address seller) external view returns (uint256) {
        return sellerGhettoCollateral[seller];
    }

    function getHeldFunds(address seller) external view returns (uint256) {
        return sellerHeldFunds[seller];
    }

    function raiseDispute(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(
            order.buyer == msg.sender || order.seller == msg.sender,
            "Only buyer or seller can raise dispute"
        );
        require(
            order.status == OrderStatus.Shipped || order.status == OrderStatus.AwaitingRelease,
            "Invalid order status for dispute"
        );

        order.status = OrderStatus.Disputed;
        emit OrderDisputed(_orderId);
    }

    function resolveDispute(
        string memory _orderId,
        bool _favorBuyer
    ) external onlyOwner nonReentrant {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Disputed, "Order not in dispute");

        if (_favorBuyer) {
            IERC20(order.paymentToken).safeTransfer(order.buyer, order.amount);
            sellerHeldFunds[order.seller] -= order.amount;
            order.status = OrderStatus.Cancelled;
            emit OrderCancelled(_orderId);
            emit SellerFundsReleased(_orderId, order.seller, order.amount);
        } else {
            _completeOrder(_orderId);
        }
    }

    function getOrder(string memory _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _feePercent;
    }

    function setNonGhettoFeeAddition(uint256 _feeAddition) external onlyOwner {
        require(_feeAddition <= 500, "Additional fee cannot exceed 5%");
        nonGhettoFeeAddition = _feeAddition;
    }

    function setGhettoToken(address _ghettoToken) external onlyOwner {
        ghettoToken = IERC20(_ghettoToken);
    }

    function setSellerHoldPercent(uint256 _holdPercent) external onlyOwner {
        require(_holdPercent <= 2000, "Hold cannot exceed 20%");
        sellerHoldPercent = _holdPercent;
    }

    function calculateTotalFee(address _paymentToken, uint256 _amount) external view returns (uint256) {
        uint256 totalFeePercent = platformFeePercent;
        if (_paymentToken != address(ghettoToken)) {
            totalFeePercent += nonGhettoFeeAddition;
        }
        return (_amount * totalFeePercent) / 10000;
    }
}
