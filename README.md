# GHOcard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [<img src="https://img.shields.io/badge/View-Video-red">](https://ethglobal.com/showcase/ghocard-3jtyy)

<img src="https://i.ibb.co/jJcygS9/test.png">

GHO powered crypto off-ramp powered by Aave. Mainly using a card to have an off ramp for GHO and AAVE.

## DApp:

DApp: https://ghocard.vercel.app/

## Android Dapp:

APK: https://github.com/altaga/GHOcard/blob/main/GHOcard/apk/app-release.apk

## Main demo video: 

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](https://ethglobal.com/showcase/ghocard-3jtyy)

# Introduction and Problem

/////////////////////////////////////////////

# Solution

Our solution is based on a progressive web app based on NextJS and powered by ConnectKit, a React Native application for our POS with NFC card reader and both virtual and physical cards to make TradFi and Crypto payments.

### System's Architecture:

<img src="https://i.ibb.co/sQwYsD5/scheme-drawio-3.png">

- All payments are possible using the [GHO token](https://gho.aave.com/), including card payments through our [Account Abstraction NFT Card](./Contracts/card.sol).

- All EVMs transactions are controlled through [ConnectKit](https://github.com/family/connectkit), [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/)

- Through [Stripe APIs](https://stripe.com/docs/api) debit card checkouts and virtual accounts.

Our progressive web dapp, in addition to being an asset manager for the tokens that we have borrowed in Aave, allows us to mint an Account Abstraction NFT Card which is an abstraction of a credit card which is a dual card that allows us to make payments both TradFi and Crypto. This provides us with all the security of blockchain systems and all the advantages of using NFTs such as rewards programs, discounts and in this case NFC payments.

# Account Abstraction NFT Card:

This Account Abstraction NFT Card integrates an abstraction wallet and NFT, providing a seamless and secure payment system for blockchain-based financial ecosystems with exclusive benefits tied to NFT ownership.

Contract: [Smart Contract Code](./Contracts/card.sol)

Interface: [Interface Smart Contract Code](./Contracts/icard.sol)

### Features:
- Account Abstraction Methods:

        // Get Native Balance
        function getBalance() external view returns (uint256); 

        // Get ERC20 (GHO) Balance
        function getBalanceECR20(address s_contract) external view returns (uint256);

        // Transfer Native Token from card
        function transferNative(uint256 value, address payable to) external payable;

        // Transfer ERC20 (GHO) from card
        function transferECR20(uint256 value, address to, address s_contract) external;

        // If the card has an NFT such as an Account Abstraction Wallet, we can transfer it.
        function transferECR721(address to, address s_contract) external;

        // This feature allows you to recover funds from the wallet by transferring the wallet owner through our API
        function transferCard(address newOwner) external;

        // Internal fallback methods.
        receive() external payable {} // Receive Deposits

        fallback() external payable {} // Receive Deposits if receive doesn't work

- NFT Implementation: The advantages of using an NFT instead of a traditional contract is being able to have the card data publicly available and being able to make payments at the terminal more easily.

  - Card Metadata Example:

          {
          "name": "Abstracted Card",
          "description": "This debit physical card integrates an abstraction wallet and NFT, providing a seamless and secure pay system for blockchain-based financial ecosystems with exclusive benefits tied to NFT ownership.",
          "attributes": [
              {
              "trait_type": "kind",
              "value": "visa"
              },
              {
              "trait_type": "tokens",
              "value": [
                  "GHO"
              ]
              },
              {
              "trait_type": "cardKind",
              "value": "debit"
              },
              {
              "trait_type": "interface",
              "value": "physical"
              }
          ],
          "image": "ipfs://bafybeiglg7vxq5g5bz5rlzyuum6lsho57gmnk3cqisdi55b3scbmps7hni/visaPhysical.png"
          }

  - Reading a VISA and Mastercard card are different at the code level.
    
    - Card Metadata: { "trait_type": "kind", "value": "visa" }
    - [Read NFC Card Code](./GHOcard/src/components/readCard.js)

  - Review of the tokens available on the card.
    - Card Metadata: { "trait_type": "tokens", "value": [ "GHO" ] }

  - At the Front End level it allows us to personalize the card and improve the user experience.

    <img src="https://i.ibb.co/DCcNhgp/image.png">

- Point of Sale Payment:
  - To make payments through NFC of the contract we must make a call to our payment API, since this is combined with the Stripe interface to be able to make TradFi payments, this is done in the cloud through an AWS Lambda.
    - [AWS Lambda Code](./AWS_Lambda/index.mjs)
    - [POS API Call Code](./GHOcard/src/screens/payment/payment.js)

# Progressive Web DApp:

Our Webapp powered by [ConnectKit](https://github.com/family/connectkit) allows a simple interface to mint virtual cards and at the same time be able to add or remove balance from them, according to our needs.

URL: https://ghocard.vercel.app/

Code: [ConnectKit Code](./webapp/src/pages/_app.js)

Theme Code: [Custom ConnectKit Style](./webapp/src/styles/connectKitTheme.js)

### Connect Kit Connection Code:

        // Connect Kit
        import { WagmiConfig, createConfig } from "wagmi";
        import { ConnectKitProvider, getDefaultConfig } from "connectkit";
        import { sepolia } from "viem/chains";
        import { customTheme } from "@/styles/connectKitTheme";
        import { ContextProvider } from "@/utils/contextModule";

        const chains = [sepolia];

        const config = createConfig(
            getDefaultConfig({
                alchemyId: process.env.ALCHEMY_ID, 
                walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID,
                appName: process.env.NEXT_PUBLIC_APPNAME,
                chains,
                appDescription: process.env.NEXT_PUBLIC_DESCRIPTION,
                appUrl: "https://ghocard.vercel.app", 
                appIcon: "https://ghocard.vercel.app/logo.png", 
            })
        );

### DApp screens:

- Connect to the DApp using ConnectKit:

    <img src="https://i.ibb.co/k9ZRn9v/Screenshot-20240120-184233.png" width="33%">

- Summary of Assets in Aave and Minted Cards:

    <img src="https://i.ibb.co/s121xwB/Screenshot-20240120-184220.png" width="33%"> 
    <img src="https://i.ibb.co/PrH6kVp/Screenshot-20240120-184224.png" width="33%">

- Add Balance to a card with just one button:

    <img src="https://i.ibb.co/dtx4JHk/Screenshot-20240120-184246.png" width="33%"> 
    <img src="https://i.ibb.co/mGHJb84/Screenshot-20240120-184257.png" width="33%">

# React Native DApp:

Our React Natve App is made in order to be able to receive money in a simple way, either TradFi through Stripe financial services and in a decentralized way with GHO from Aave and Wallet Connect.

NOTE: Payment systems like these in Layer 1, due to the gas fees and the block confirmation time, are practically unviable. To create a viable payment system, Layer 2, such as Polygon or ZK solutions, must be used. .

### NFC Payments:

- A payment order is created in the application UI like any other POS terminal. In the case of NFC payment we will select Pay With Card.

    <img src="https://i.ibb.co/s5dpp3V/vlcsnap-2024-01-20-18h58m49s410.png" width="33%">

- The POS will enter card reading mode and wait for a card reading on the reader above, however any cell phone with an NFC reader can work perfectly.

    <img src="https://i.ibb.co/d2qYvzg/POSbase-1.png" width="33%">

- Once the card is read, depending on whether it is VISA or Mastercard, which we can know thanks to the metadata, we can charge either TradFi (Stripe) or Crypto (GHO Aave).

    <img src="https://i.ibb.co/n1qQ9xd/Screenshot-2024-01-20-192456.png" width="33%">

 - In the case of a payment through GHO, we will call our API the AWS Lambda that will make the call to the smart contract to make the payment.
  
        const contract = new ethers.Contract(
            "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
            icardABI,
            walletWithProvider
        );
        const tx = await contract.transferECR20(
            ethers.utils.parseUnits(eventBody.amount.toString(), 18).toHexString(),
            eventBody.address,
            "0xc4bf5cbdabe595361438f8c6a187bdc330539c60"
        );
        const response = {
            statusCode: 200,
            body: JSON.stringify({
            tx: tx.hash,
            result: "success",
            }),
        };
        return response;

- Once the payment has been made, we will have the options of viewing the explorer to verify the payment in the blockchain, printing the receipt or restarting the POS for a new payment.

    <img src="https://i.ibb.co/zV3dncY/vlcsnap-2024-01-20-19h13m51s283.png" width="32%"> <img src="https://i.ibb.co/6BM1BLW/vlcsnap-2024-01-20-19h13m40s361.png" width="32%"> <img src="https://i.ibb.co/nB1KrTp/Screenshot-2024-01-20-192624.png" width="32%"> 

### QR Payments:

- A payment order is created in the application UI like any other POS terminal. In the case of payment with QR we will select Pay With QR.

    <img src="https://i.ibb.co/s5dpp3V/vlcsnap-2024-01-20-18h58m49s410.png" width="33%">

- This type of payment will create a payment request through Wallet Connect, this will be a single-use QR, so once the connection in the DApp is finished there will be no risk of generating another subsequent request.

    <img src="https://i.ibb.co/FxDVtWy/vlcsnap-2024-01-20-18h59m25s134.png" width="33%">

- Connecting to the DApp is as simple as opening the QR reader of our preferred wallet and connecting to it.

    <img src="https://i.ibb.co/QnyStkD/vlcsnap-2024-01-20-21h53m45s818.png" width="32%"> <img src="https://i.ibb.co/tPMNqkY/vlcsnap-2024-01-20-21h53m52s645.png" width="32%"> <img src="https://i.ibb.co/txwM9k3/vlcsnap-2024-01-20-21h54m01s616.png" width="32%">

- Once the connection is made, the POS will show us an expected screen, since we will have to sign the transaction in the wallet.

    <img src="https://i.ibb.co/YhZ7F4R/vlcsnap-2024-01-20-21h56m05s601.png" width="26%"> <img src="https://i.ibb.co/6FjycqQ/vlcsnap-2024-01-20-19h13m13s915.png" width="32%">

- Once the payment has been made, we will have the options of viewing the explorer to verify the payment in the blockchain, printing the receipt or restarting the POS for a new payment.

    <img src="https://i.ibb.co/zV3dncY/vlcsnap-2024-01-20-19h13m51s283.png" width="32%"> <img src="https://i.ibb.co/6BM1BLW/vlcsnap-2024-01-20-19h13m40s361.png" width="32%"> <img src="https://i.ibb.co/1XyQwm4/vlcsnap-2024-01-20-19h13m54s458.png" width="32%"> 
