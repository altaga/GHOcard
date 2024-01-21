# GHOcard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [<img src="https://img.shields.io/badge/View-Video-red">](pending...)

<img src="https://i.ibb.co/jJcygS9/test.png">

GHO powered crypto off-ramp powered by Aave. Mainly using a card to have an off ramp for GHO and AAVE.

## PWDApp:

Dapp: https://ghocard.vercel.app/

## Android Dapp:

APK: 

## Main demo video: 

[![Demo](https://i.ibb.co/g4W3ypx/image.png)](pending...)

# Introduction and Problem

/////////////////////////////////////////////

# Solution

Nuestra solucion se basa en una progressive web app basada en NextJS y powered by ConnectKit, ademas de una aplicacion React Native para nuestro POS con lector de NFC cards.

### System's Architecture:

<img src="https://i.ibb.co/sQwYsD5/scheme-drawio-3.png">

- All payments are possible using the [GHO token](https://gho.aave.com/), including card payments through our [NFT Card Abstraction Wallet](./Contracts/card.sol).

- All EVMs transactions are controlled through [ConnectKit](https://github.com/family/connectkit), [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/)

- Through [Stripe APIs](https://stripe.com/docs/api) credit card checkouts and virtual accounts.

El flujo de pagos es obtener fondos de la plataforma de [Aave](https://aave.com/), conectarse a nuestra Progressive Web App basada en NextJS y compatible con cualquier wallet gracias a [ConnectKit](https://github.com/family/connectkit), una vez cnoectados transferir los fondos deseados a la tarjeta Virtual o Fisica, esta es una cuenta TradFi gracias a los servicios de [Stripe](https://stripe.com/docs/api) y de crypto gracias a nuestra [NFT Card Abstraction Wallet](./Contracts/card.sol), una vez hecho esto podras pagar en culquier establecimiento compatible con GHOcard POS App, la cual es una aplicacion nativa de android para cualquier POS con lector de NFC cards.

# PWA Connection

