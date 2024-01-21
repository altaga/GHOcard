// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICardContractNFT {

    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    function mint(string memory _uri, address _driver) external;

    function totalContent() external view returns (uint256);

    function getBalance() external view returns (uint256);

    function getBalanceECR20(address s_contract) external view returns (uint256);

    function transferNative(uint256 value, address payable to) external payable;

    function transferECR20(uint256 value, address to, address s_contract) external;

    function transferECR721(address to, address s_contract) external;

    function garbage() external;
}
