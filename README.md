# GHOcard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [<img src="https://img.shields.io/badge/View-Video-red">](pending...)

<img src="https://i.ibb.co/jJcygS9/test.png">

GHO powered crypto off-ramp powered by Aave. Mainly using a card to have an off ramp for GHO and AAVE.

## DApp:

DApp: https://ghocard.vercel.app/

## Android Dapp:

APK: https://github.com/altaga/GHOcard/blob/main/GHOcard/apk/app-release.apk

## Main demo video: 

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](pending...)

# Introduction and Problem

/////////////////////////////////////////////

# Solution

Nuestra solucion se basa en una progressive web app basada en NextJS y powered by ConnectKit, una aplicacion React Native para nuestro POS con lector de NFC cards y tarjetas tanto virtuales como fisicas para relizar pagos TradFi y Crypto.

### System's Architecture:

<img src="https://i.ibb.co/sQwYsD5/scheme-drawio-3.png">

- All payments are possible using the [GHO token](https://gho.aave.com/), including card payments through our [Account Abstraction NFT Card](./Contracts/card.sol).

- All EVMs transactions are controlled through [ConnectKit](https://github.com/family/connectkit), [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/)

- Through [Stripe APIs](https://stripe.com/docs/api) debit card checkouts and virtual accounts.

Nuestra progresive web dapp ademas de un asset manager de los tokens que tenemos prestados en Aave, nos permite realizar el mint de un Account Abstraction NFT Card el cual es una abstraccion de una tarjeta de debido la cual es una trajeta dual que nos permite relizar pagos tanto de TradFi como Crypto. Esto nos provee toda la seguridad de los sistemas blockchain y todas las ventajas de usar NFTs como lo son programas de recompensas, descuentos y en este caso pagos por NFC.

# Account Abstraction NFT Card:

This AA NFT Card integrates an abstraction wallet and NFT, providing a seamless and secure pay system for blockchain-based financial ecosystems with exclusive benefits tied to NFT ownership.

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

- NFT Implementation: Las ventajas de utilizar un NFT en vez de un contrato tradicional es poder tener los datos de la tarjeta de forma publica y poder realizar los cobros en terminal de forma mas sencilla.

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

  - La lectura de una tarjeta VISA y Mastercard son diferentes a nivel de codigo.
    
    - Card Metadata: { "trait_type": "kind", "value": "visa" }
    - [Read NFC Card Code](./GHOcard/src/components/readCard.js)

  - Revision de los tokens disponibles en la tarjeta.
    - Card Metadata: { "trait_type": "tokens", "value": [ "GHO" ] }

  - A nivel de Front End nos permite realizar una personalizacion de la tarjeta y mejorar la experiencia de usuario.

    <img src="https://i.ibb.co/DCcNhgp/image.png">

- POS Payment:
  - Para realizar los pagos mediante NFC del contrato debemos relizar una llamada a nuestra API de pagos, ya que esta esta combinada con la interfaz de Stripe para poder realizar pagos TradFi esta se realiza en cloud mediante una AWS Lambda. 
    - [AWS Lambda Code](./AWS_Lambda/index.mjs)
    - [POS API Call Code](./GHOcard/src/screens/payment/payment.js)

# Progressive Web DApp:

Nuestra aplicacion web powered by [ConnectKit](https://github.com/family/connectkit) permite una interfaz sencilla para realizar el mint de las tarjetas virtuales y a su vez poder agregarles o quitarles saldo, segun nuestras necesidades.

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

- Conectarse a la DApp mediante ConnectKit:

    <img src="https://i.ibb.co/k9ZRn9v/Screenshot-20240120-184233.png" width="33%">

- Summary de los Assets en Aave y Tarjetas mintadas:

    <img src="https://i.ibb.co/s121xwB/Screenshot-20240120-184220.png" width="33%"> 
    <img src="https://i.ibb.co/PrH6kVp/Screenshot-20240120-184224.png" width="33%">

- Agregar Balance a una tarjeta con solo un boton:

    <img src="https://i.ibb.co/dtx4JHk/Screenshot-20240120-184246.png" width="33%"> 
    <img src="https://i.ibb.co/mGHJb84/Screenshot-20240120-184257.png" width="33%">

# React Native DApp:

Nuestra React Natve App esta hecha con el fin de poder recibir dinero de formasencilla ya sea TradFi mediante los servicios financieros de Stripe y de forma decentralizada con GHO de Aave y Wallet Connect.

NOTA: Los sistemas de pagos como estos en Layer 1, debido a las gas fees y el tiempo de confirmacion de los bloques son practicamente inviables, para la realizacion de un sistema de pagos viable se deben usar Layer 2 como lo son Polygon o soluciones ZK.

### NFC Payments:

- Se crea una orden de pago en la UI de la aplicacion como cualquier otro POS terminal. Para el caso del pago NFC seleccionaremos Pay With Card.

    <img src="https://i.ibb.co/s5dpp3V/vlcsnap-2024-01-20-18h58m49s410.png" width="33%">

- El POS entrara en modo lectura de tarjetas y esperara una lectura de tarjate en el lector de arriba, sin embargo cualquier celular con lector NFC puede funcionar perfectamente.

    <img src="https://i.ibb.co/d2qYvzg/POSbase-1.png" width="33%">

- Una vez leida la tarjeta, segun sea VISA o Mastercard, lo cual podemos saberlo gracias a la metadata, podemos realizar el cobro ya sea de TradFi (Stripe) o Crypto (GHO Aave).

    <img src="https://i.ibb.co/n1qQ9xd/Screenshot-2024-01-20-192456.png" width="33%">

 - En el caso de un pago mediante GHO, llamaremos nuestra API la AWS Lambda que realizara la llamada al smart contract para relizar el pago.
  
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

- Una vez realizado el pago tendremos las opciones de visualizar el explorer patra verificar el pago en la blockchain, imprimir el recibo o reiniciar el POS para un pago nuevo.

    <img src="https://i.ibb.co/zV3dncY/vlcsnap-2024-01-20-19h13m51s283.png" width="32%"> <img src="https://i.ibb.co/6BM1BLW/vlcsnap-2024-01-20-19h13m40s361.png" width="32%"> <img src="https://i.ibb.co/nB1KrTp/Screenshot-2024-01-20-192624.png" width="32%"> 

### QR Payments:

- Se crea una orden de pago en la UI de la aplicacion como cualquier otro POS terminal. Para el caso del pago con QR seleccionaremos Pay With QR.

    <img src="https://i.ibb.co/s5dpp3V/vlcsnap-2024-01-20-18h58m49s410.png" width="33%">

- Este tipo de pago crear una peticion de pago mediante Wallet Connect, este sera un QR se un solo uso, asi que una vez terminada la conexion en la DApp no habra riesgo de poder generar otra peticion posterior.

    <img src="https://i.ibb.co/FxDVtWy/vlcsnap-2024-01-20-18h59m25s134.png" width="33%">

- Conectarse a la DApp es tan sencillo como abrir el QR reader de nuestra wallet de preferencia y realizar la conexion a la misma.

    <img src="https://i.ibb.co/QnyStkD/vlcsnap-2024-01-20-21h53m45s818.png" width="32%"> <img src="https://i.ibb.co/tPMNqkY/vlcsnap-2024-01-20-21h53m52s645.png" width="32%"> <img src="https://i.ibb.co/txwM9k3/vlcsnap-2024-01-20-21h54m01s616.png" width="32%">

- Una vez realizada la conexion el POS nos mostrara una pantalla se espera, ya que tendremos que firmar la transaccion en la wallet.

    <img src="https://i.ibb.co/YhZ7F4R/vlcsnap-2024-01-20-21h56m05s601.png" width="26%"> <img src="https://i.ibb.co/6FjycqQ/vlcsnap-2024-01-20-19h13m13s915.png" width="32%">

- Una vez realizado el pago tendremos las opciones de visualizar el explorer patra verificar el pago en la blockchain, imprimir el recibo o reiniciar el POS para un pago nuevo.

    <img src="https://i.ibb.co/zV3dncY/vlcsnap-2024-01-20-19h13m51s283.png" width="32%"> <img src="https://i.ibb.co/6BM1BLW/vlcsnap-2024-01-20-19h13m40s361.png" width="32%"> <img src="https://i.ibb.co/1XyQwm4/vlcsnap-2024-01-20-19h13m54s458.png" width="32%"> 