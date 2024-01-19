import "@/styles/globals.css";

// Connect Kit
import { WagmiConfig, createConfig } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { sepolia } from "viem/chains";
import { customTheme } from "@/styles/connectKitTheme";
import { ContextProvider } from "@/utils/contextModule";

const chains = [sepolia];

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: process.env.ALCHEMY_ID, // or infuraId
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID,
    appName: process.env.NEXT_PUBLIC_APPNAME,
    chains,
    appDescription: process.env.NEXT_PUBLIC_DESCRIPTION,
    appUrl: "https://ghocard.vercel.app", // your app's url
    appIcon: "https://ghocard.vercel.app/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

export default function App({ Component, pageProps }) {
  return (
    <ContextProvider>
      <WagmiConfig config={config}>
        <ConnectKitProvider customTheme={{ ...customTheme }}>
          <Component {...pageProps} />
        </ConnectKitProvider>
      </WagmiConfig>
    </ContextProvider>
  );
}
