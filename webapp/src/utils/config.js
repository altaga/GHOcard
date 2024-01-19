import { http } from "viem";
import { createConfig, sepolia } from "wagmi";

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});
