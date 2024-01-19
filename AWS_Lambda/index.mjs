import ethers from "ethers";
import { icardABI } from "./icard.js";

const privateKey = process.env.NODE_PRIVATE_KEY;
const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.NODE_ALCHEMY_KEY}`
);
const walletWithProvider = new ethers.Wallet(privateKey, provider);

export const handler = async (event) => {
  let eventBody = JSON.parse(event.body);
  if (eventBody.currency === "USD") {
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: {
          result: "success",
        },
      }),
    };
    return response;
  } else if (eventBody.currency === "GHO") {
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
  }
};

/**
    // Debug Event for local testing
    let event = {
      body: {
        amount: 0.1,
        currency: "GHO",
        address: "0xBf194eBEB11cDAe7eC8C17CF8CF934785857cE66", // Change this for your address
      },
    };
    
    handler(event).then((res)=>console.log(res)).catch((e)=>console.log(e))
  */
