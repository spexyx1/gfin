// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title GhettoToken
 * @dev GHETTO token with controlled external transfers and blacklisting
 *
 * Features:
 * - 2 decimal places (100 = 1.00 GHETTO)
 * - Initial supply: 10,000,000 GHETTO (1,000,000,000 base units)
 * - Owner-controlled external transfers (DEX listing protection)
 * - Address blacklisting capability
 * - Marketplace contract whitelisting
 * - Mintable and burnable by owner
 * - Pausable for emergency situations
 */
contract GhettoToken is ERC20, ERC20Burnable, Pausable, Ownable {
    using SafeERC20 for IERC20;

    uint8 private constant _DECIMALS = 2;
    uint256 private constant _INITIAL_SUPPLY = 10_000_000 * 10**_DECIMALS;

    mapping(address => bool) public blacklisted;
    mapping(address => bool) public marketplaceContracts;
    bool public externalTransfersAllowed = false;

    event AddressBlacklisted(address indexed account, bool blacklisted);
    event MarketplaceContractUpdated(address indexed contractAddress, bool whitelisted);
    event ExternalTransfersToggled(bool allowed);

    constructor() ERC20("GHETTO Token", "GHETTO") Ownable(msg.sender) {
        _mint(msg.sender, _INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function setBlacklisted(address account, bool _blacklisted) external onlyOwner {
        require(account != owner(), "Cannot blacklist owner");
        blacklisted[account] = _blacklisted;
        emit AddressBlacklisted(account, _blacklisted);
    }

    function setMarketplaceContract(address contractAddress, bool whitelisted) external onlyOwner {
        marketplaceContracts[contractAddress] = whitelisted;
        emit MarketplaceContractUpdated(contractAddress, whitelisted);
    }

    function setExternalTransfersAllowed(bool allowed) external onlyOwner {
        externalTransfersAllowed = allowed;
        emit ExternalTransfersToggled(allowed);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(!blacklisted[to], "Cannot mint to blacklisted address");
        _mint(to, amount);
    }

    function burn(uint256 amount) public override onlyOwner {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyOwner {
        super.burnFrom(account, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _isTransferAllowed(address from, address to) internal view returns (bool) {
        if (from == owner() || to == owner()) {
            return true;
        }

        if (blacklisted[from] || blacklisted[to]) {
            return false;
        }

        if (externalTransfersAllowed) {
            return true;
        }

        return marketplaceContracts[from] || marketplaceContracts[to];
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(_isTransferAllowed(from, to), "Transfer not allowed: external transfers restricted");
        }

        super._update(from, to, value);
    }

    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover GHETTO tokens");
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        bool externalAllowed_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            externalTransfersAllowed
        );
    }
}
