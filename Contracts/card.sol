// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CardContractNFT is ERC721URIStorage, ReentrancyGuard {
    // Owner
    address owner;
    // NFT Vars
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public lastTokenId;
    string public lastURI;
    // Program Address
    address programAddress = 0xFff50c913f3Ba1f226417cb237F5c4E334da4039;
    // GHO Address
    address ghoAddress = 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60;

    modifier onlyOwnerOrProgram() {
        require(
            msg.sender == owner || msg.sender == programAddress,
            "Not authorized"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyProgram() {
        require(msg.sender == programAddress, "Not authorized");
        _;
    }

    constructor(string memory _uri) ERC721("Card NFT", "CARD") {
        owner = msg.sender;
        mint(_uri, msg.sender);
    }

    function mint(string memory _uri, address _driver) public onlyOwner {
        _mint(_driver, _tokenIds.current());
        _setTokenURI(_tokenIds.current(), _uri);
        _tokenIds.increment();
    }

    function totalContent() public view virtual returns (uint256) {
        return _tokenIds.current();
    }

    // Natives Abtraction

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getBalanceECR20(address s_contract) public view returns (uint256) {
        IERC20 ERC20Contract = IERC20(s_contract);
        return ERC20Contract.balanceOf(address(this));
    }

    function transferNative(uint256 value, address payable to)
        public
        payable
        onlyOwnerOrProgram
    {
        require(address(this).balance >= value);
        to.transfer(value);
    }

    function transferECR20(
        uint256 value,
        address to,
        address s_contract
    ) public onlyOwnerOrProgram {
        IERC20 ERC20Contract = IERC20(s_contract);
        require(ERC20Contract.balanceOf(address(this)) >= value);
        ERC20Contract.transfer(to, value);
    }

    function transferECR721(address to, address s_contract)
        public
        onlyOwnerOrProgram
    {
        ERC721 ERC721Contract = ERC721(s_contract);
        ERC721Contract.transferFrom(address(this), to, 0);
    }

    // Recover Account with Program

    function transferCard(address newOwner) public onlyProgram {
        owner = newOwner;
    }

    receive() external payable {} // Recieve Deposits

    fallback() external payable {} // Recieve Deposits if recieve doesn't work

    // Fix Utility

    function newURI(uint256 _tokenId, string memory _newuri) public onlyOwner {
        _setTokenURI(_tokenId, _newuri);
    }
}
