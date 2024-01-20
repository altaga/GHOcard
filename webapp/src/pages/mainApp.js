"use client";
import { ConnectKitButton } from "connectkit";
import React, { useEffect } from "react";
import { useSendTransaction, useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { isBrowser, isMobile } from "react-device-detect";

export default function MainApp() {
  const { isConnected, isDisconnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isDisconnected) {
      router.push("/");
    }
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, isDisconnected, router]);


  if (isMobile) {
    return (
      <div className="containerMobile">
        <div className="titleMobile">
          Welcome to {process.env.NEXT_PUBLIC_APPNAME}
        </div>
        <div className="connectCardMobile">
          <ConnectKitButton />
        </div>
      </div>
    );
  }

  if (isBrowser) {
    return (
      <div className="container">
        <div className="title">
          Welcome to {process.env.NEXT_PUBLIC_APPNAME}
        </div>
        <div className="connectCard">
          <div style={{ margin: "30px" }}>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    );
  }
}
