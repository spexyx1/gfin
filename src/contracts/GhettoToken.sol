// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
    
    // Token configuration
    uint8 private constant _DECIMALS = 2;
    uint256 private constant _INITIAL_SUPPLY = 10_000_000 * 10**_DECIMALS; // 10 million GHETTO
    
    // Access control
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public marketplaceContracts;
    bool public externalTransfersAllowed = false;
    
    // Events
    event AddressBlacklisted(address indexed account, bool blacklisted);
    event MarketplaceContractUpdated(address indexed contractAddress, bool whitelisted);
    event ExternalTransfersToggled(bool allowed);
    
    constructor() ERC20("GHETTO Token", "GHETTO") {
        _mint(msg.sender, _INITIAL_SUPPLY);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For GHETTO token, this is 2 (e.g., 100 = 1.00 GHETTO)
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
    
    /**
     * @dev Blacklist or unblacklist an address
     * @param account The address to blacklist/unblacklist
     * @param _blacklisted True to blacklist, false to unblacklist
     */
    function setBlacklisted(address account, bool _blacklisted) external onlyOwner {
        require(account != owner(), "Cannot blacklist owner");
        blacklisted[account] = _blacklisted;
        emit AddressBlacklisted(account, _blacklisted);
    }
    
    /**
     * @dev Add or remove a marketplace contract from whitelist
     * @param contractAddress The marketplace contract address
     * @param whitelisted True to whitelist, false to remove from whitelist
     */
    function setMarketplaceContract(address contractAddress, bool whitelisted) external onlyOwner {
        marketplaceContracts[contractAddress] = whitelisted;
        emit MarketplaceContractUpdated(contractAddress, whitelisted);
    }
    
    /**
     * @dev Toggle external transfers (DEX listing control)
     * @param allowed True to allow external transfers, false to restrict
     */
    function setExternalTransfersAllowed(bool allowed) external onlyOwner {
        externalTransfersAllowed = allowed;
        emit ExternalTransfersToggled(allowed);
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in base units)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(!blacklisted[to], "Cannot mint to blacklisted address");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from owner's balance
     * @param amount The amount of tokens to burn (in base units)
     */
    function burn(uint256 amount) public override onlyOwner {
        super.burn(amount);
    }
    
    /**
     * @dev Burn tokens from a specific account (only owner)
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn (in base units)
     */
    function burnFrom(address account, uint256 amount) public override onlyOwner {
        super.burnFrom(account, amount);
    }
    
    /**
     * @dev Pause token transfers (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Check if a transfer is allowed based on restrictions
     * @param from The sender address
     * @param to The recipient address
     * @return bool True if transfer is allowed
     */
    function _isTransferAllowed(address from, address to) internal view returns (bool) {
        // Owner can always transfer
        if (from == owner() || to == owner()) {
            return true;
        }
        
        // Blacklisted addresses cannot transfer
        if (blacklisted[from] || blacklisted[to]) {
            return false;
        }
        
        // If external transfers are allowed, any non-blacklisted address can transfer
        if (externalTransfersAllowed) {
            return true;
        }
        
        // If external transfers are not allowed, only whitelisted marketplace contracts can receive/send
        return marketplaceContracts[from] || marketplaceContracts[to];
    }
    
    /**
     * @dev Override transfer function to implement restrictions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Skip checks for minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            require(_isTransferAllowed(from, to), "Transfer not allowed: external transfers restricted");
        }
        
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param tokenAddress The address of the token to recover
     * @param amount The amount to recover
     */
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover GHETTO tokens");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
    
    /**
     * @dev Get token information for frontend integration
     * @return name_ Token name
     * @return symbol_ Token symbol
     * @return decimals_ Token decimals
     * @return totalSupply_ Total token supply
     * @return externalAllowed_ Whether external transfers are allowed
     */
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