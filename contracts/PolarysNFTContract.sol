// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import '@openzeppelin/contracts/utils/Strings.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./ERC721B.sol";

contract PolarysNFTContract is ERC2981, ERC721B, AccessControl, ReentrancyGuard {

    using Strings for uint256;
    
    enum SaleStatus {
        NOT_STARTED,
        PRIVATE_SALE,
        PUBLIC_SALE
    }
    
    event DepositedMetis(uint256 indexed amount);
    event NFTMinted(address indexed recipient, uint256 quantity);
    event SetPrivateSalePrice(uint256 price);
    event SetPublicSalePrice(uint256 price);
    event SetBaseURI(string baseURI);
    event SetRoyaltyFee(uint96 fee);
    event WithdrewMetis(address indexed to, uint256 amount);
    event StartedPrivateSale(SaleStatus indexed saleStatus, uint256 timestamp);
    event EndedPrivateSale(SaleStatus indexed saleStatus, uint256 timestamp);
    

    string private baseURI;
    uint256 private constant MAX_SUPPLY = 2500;
    uint256 private constant GIFT_METIS = 1e16;     //0.01 Metis
    uint256 private _privateSalePrice;
    uint256 private _publicSalePrice;
    uint96 private _royaltyFee;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    SaleStatus private _saleStatus;

    constructor(
        string memory name_, 
        string memory symbol_
    ) ERC721B(name_, symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721B, AccessControl, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
    @dev Setup minter role
     */
    function setupMinterRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, account);
    }

    function setPrivateSalePrice(uint256 price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(price <= 1000 * 1e6, "Should not exceed 1000");
        _privateSalePrice = price;
        emit SetPrivateSalePrice(price);
    }

    function setPublicSalePrice(uint256 price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(price <= 1000 * 1e6, "Should not exceed 1000");
        _publicSalePrice = price;
        emit SetPublicSalePrice(price);
    }
    
    function setRoyaltyFee(uint96 fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(fee < 100 * 1e2, "Incorrect royalty fee");
        _royaltyFee = fee;
        emit SetRoyaltyFee(fee);
    }
    
    function getRoyaltyFee() view external returns(uint96) {
        return _royaltyFee;
    }

    function getSaleStatus() view external returns (SaleStatus) {
        return _saleStatus;
    }

    function getSalePrice() view external returns(uint256) {
        if(_saleStatus == SaleStatus.PUBLIC_SALE) {
            return _publicSalePrice;
        } else {
            return _privateSalePrice;
        }
    }

    function startPrivateSale() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_saleStatus == SaleStatus.NOT_STARTED, "Only allowed if status is not started");
        _saleStatus = SaleStatus.PRIVATE_SALE;
        emit StartedPrivateSale(_saleStatus, block.timestamp);
    }

    function endPrivateSale() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_saleStatus == SaleStatus.PRIVATE_SALE, "Only allowed if status is private sale");
        _saleStatus = SaleStatus.PUBLIC_SALE;
        emit EndedPrivateSale(_saleStatus, block.timestamp);
    }

    /**
    @dev Deposit metis
     */
    function depositMetis() external payable {
        emit DepositedMetis(msg.value);
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
    function setBaseURI(string calldata _baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _baseURI;
        emit SetBaseURI(_baseURI);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Mint NFT
     * If the user address is not active yet on Metis, contract sends 0.01 Metis along the NFT
     * Only MINTER_ROLE account can execute this function
     * @param to recipient address
     * @param quantity NFT quantity to mint
     */
    function mint(address to, uint256 quantity) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to.code.length == 0, "Can not mint NFT to contract address");
        require(_saleStatus != SaleStatus.NOT_STARTED, "Sale is not started yet");
        require(quantity <= 10, "Can not mint NFTs more than 10 NFTs at one transaction");
        uint256 currentSupply = _owners.length;
        require(currentSupply + quantity <= MAX_SUPPLY, "Can not mint NFT more than MAX_SUPPLY");
        
        if (address(to).balance == 0 && address(this).balance >= GIFT_METIS) {
            (bool sent, ) = payable(to).call{value: GIFT_METIS}("");
            require(sent, "Failed to send Metis");
        }
        _mint(to, quantity);
        
        
        // Set token royalty per each tokenId
        unchecked {
            uint96 royaltyFee = _royaltyFee;
            for (uint256 i = currentSupply; i < currentSupply + quantity; i++) {
                _setTokenRoyalty(i, to, royaltyFee);
            }
        }

        emit NFTMinted(to, quantity);
    }

    function withdrawMetis(address to) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(address(this).balance > 0, "No balance");
        require(to.code.length == 0, "Can not withraw Metis to contract address");
        uint256 balance = address(this).balance;
        (bool sent, ) = payable(to).call{value: balance}("");
        require(sent, "Failed to withdraw Metis");
        emit WithdrewMetis(to, balance);
    }
}