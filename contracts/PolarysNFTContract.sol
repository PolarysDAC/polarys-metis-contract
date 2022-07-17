// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./ERC721B.sol";

contract PolarysNFTContract is ERC2981, ERC721B, Ownable, Pausable, AccessControl, ReentrancyGuard {

    using Strings for uint256;

    event MetisDeposited(uint256 indexed amount);
    event NFTMinted(address indexed recipient, uint256 quantity);

    string private baseURI;
    uint256 private constant MAX_SUPPLY = 2500;
    uint256 private _currentSupply;
    uint256 private constant GIFT_METIS = 1e16;     //0.01 Metis
    uint256 private _privateSalePrice;
    uint256 private _publicSalePrice;
    uint256 public metisBalance;
    uint96 private _royaltyFee;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory name_, 
        string memory symbol_
    ) ERC721B(name_, symbol_) {}

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721B, AccessControl, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
    @dev Setup minter role
     */
    function setupMinterRole(address account) external onlyOwner {
        _grantRole(MINTER_ROLE, account);
    }

    function setPrivateSalePrice(uint256 price) external onlyOwner whenNotPaused {
        _privateSalePrice = price;
    }

    function setPublicSalePrice(uint256 price) external onlyOwner whenNotPaused {
        _publicSalePrice = price;
    }
    
    function setRoyaltyFee(uint96 fee) external onlyOwner whenNotPaused {
        _royaltyFee = fee;
    }
    
    function getRoyaltyFee() view public returns(uint96) {
        return _royaltyFee;
    }

    function getPrivateSalePrice() view public returns(uint256) {
        return _privateSalePrice;
    }

    function getPublicSalePrice() view public returns(uint256) {
        return _publicSalePrice;
    }

    /**
    @dev Deposit metis
     */
    function depositMetis() public payable {
        metisBalance += msg.value;
        emit MetisDeposited(msg.value);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        if (!_exists(_tokenId)) revert OwnerQueryForNonexistentToken();
        return string(abi.encodePacked(baseURI, Strings.toString(_tokenId)));
    }

    /**
     * Set base URI of NFT
     */
    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Mint NFT
     * If the user address is not active yet on Metis, contract sends 0.01 Metis along the NFT
     * Only MINTER_ROLE account can execute this function
     * @param to recipient address
     * @param quantity NFT quantity to mint
     */
    function mint(address to, uint256 quantity) external whenNotPaused onlyRole(MINTER_ROLE) nonReentrant {
        require(to.code.length == 0, "Can not mint NFT to contract address");
        require(to != address(0), "Should not be zero address");
        require(_currentSupply + quantity <= MAX_SUPPLY, "Can not mint NFT more than MAX_SUPPLY");
        
        if (address(to).balance == 0 && metisBalance >= GIFT_METIS) {
            metisBalance -= GIFT_METIS;
            (bool sent, ) = payable(to).call{value: GIFT_METIS}("");
            require(sent, "Failed to send Metis");
        }
        _mint(to, quantity);
        
        // Set token royalty per each tokenId
        unchecked {
            for (uint256 i = _currentSupply; i < _currentSupply + quantity; i++) {
                _setTokenRoyalty(i, to, _royaltyFee);
            }
        }
        _currentSupply += quantity;
        
        if (MAX_SUPPLY == _currentSupply) {
            _pause();
        }

        emit NFTMinted(to, quantity);
    }
}