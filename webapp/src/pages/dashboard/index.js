"use client";
import CardCointainer from "@/components/cardCointainer";
import { icardABI } from "@/contracts/icard";
import { ghoABI } from "@/contracts/ierc20-GHO";
import { poolProxyABI } from "@/contracts/poolProxy";
import { walletBalanceProviderABI } from "@/contracts/walletBalanceProvider";
import { tokenData } from "@/utils/constants";
import { convertJsonToArray, generateDummyCreditCard } from "@/utils/utils";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { MdSwitchAccessShortcut } from "react-icons/md";
import { Modal } from "reactstrap";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import logo from "../../assets/logo.png";
import {
  customThemeDashboard,
  customThemeDashboardMobile,
} from "../../styles/connectKitTheme";

export default function MainApp({ card }) {
  // Router
  const { address: accountAddress, isConnected, isDisconnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isDisconnected) {
      router.push("/");
    }
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, isDisconnected, router]);

  // Selector Mobile
  const [showAssets, setShowAssets] = React.useState(true);
  // Cards
  const [showCardVirtual, setShowCardVirtual] = React.useState(false);
  // Balance Card Virtual
  const [virtualBalance, setCardVirtualBalance] = React.useState(0);
  // Balance Card Physical
  const [physicalBalance, setCardPhysicalBalance] = React.useState(0);
  // Chain General Balance
  const [chainBalance, setChainBalance] = React.useState(0);
  // Token Balances
  const [tokenBalancesArray, setTokenBalancesArray] = React.useState([]);
  // Modal
  const [modalOpen1, setModalOpen1] = React.useState(false);
  const [modalOpen2, setModalOpen2] = React.useState(false);
  const [modalOpen3, setModalOpen3] = React.useState(false);
  const [modalOpen4, setModalOpen4] = React.useState(false);
  // Amount to add or remove
  const [amount, setAmount] = React.useState(0);
  // Flag Update
  const [forceUpdate, setForceUpdate] = React.useState(false);

  // Interfaces
  const { write: writeERC20, data: writeERC20Data } = useContractWrite({
    abi: ghoABI,
  });
  const { write: writeICard, data: writeICardData } = useContractWrite({
    abi: icardABI,
  });

  // Sequentially call all hooks

  // Read Token Balances
  const { data: tokenBalances, refetch: refetchTokenBalances } =
    useContractRead({
      address: "0xCD4e0d6D2b1252E2A709B8aE97DBA31164C5a709",
      abi: walletBalanceProviderABI,
      functionName: "batchBalanceOf",
      args: [
        [accountAddress],
        [...convertJsonToArray(tokenData, "tokenAddress")],
      ],
    });
  // Read Collateral
  const { data: collateralAsset, refetch: refetchCollateral } = useContractRead(
    {
      address: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      abi: poolProxyABI,
      functionName: "getUserAccountData",
      args: [accountAddress],
    }
  );

  const { data: cardPhysicalBalance, refetch: refetchCardPhysical } =
    useContractRead({
      address: "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
      abi: icardABI,
      functionName: "getBalanceECR20",
      args: [tokenData.GHO.tokenAddress],
    });

  const { data: cardVirtualBalance, refetch: refetchCardVirtual } =
    useContractRead({
      address: "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
      abi: icardABI,
      functionName: "getBalanceECR20",
      args: [tokenData.GHO.tokenAddress],
    });

  const waitForTransactionERC20 = useWaitForTransaction({
    hash: writeERC20Data?.hash,
  });

  const waitForTransactionICardData = useWaitForTransaction({
    hash: writeICardData?.hash,
  });

  useEffect(() => {
    if (isDisconnected || accountAddress === undefined) return;
    if (
      forceUpdate &&
      (!(typeof waitForTransactionERC20.data === "undefined") ||
        !(typeof waitForTransactionICardData.data === "undefined"))
    ) {
      setForceUpdate(false);
      refetchCardVirtual();
      refetchCardPhysical();
      refetchTokenBalances();
      refetchCollateral();
    }
  }, [
    waitForTransactionERC20,
    waitForTransactionICardData,
    forceUpdate,
    isDisconnected,
    accountAddress,
    refetchCardVirtual,
    refetchCardPhysical,
    refetchTokenBalances,
    refetchCollateral,
  ]);

  // Send Transaction

  const addBalance = async (amount, cardAddress, tokenAddress) => {
    if (isDisconnected || accountAddress === undefined) return;
    writeERC20({
      address: tokenAddress,
      functionName: "transfer",
      args: [cardAddress, ethers.utils.parseUnits(amount.toString(), "ether")],
    });
    setForceUpdate(true);
    setAmount(0);
    setModalOpen1(false);
    setModalOpen3(false);
  };

  const removeBalance = async (amount, cardAddress, tokenAddress) => {
    if (isDisconnected || accountAddress === undefined) return;
    writeICard({
      address: cardAddress,
      functionName: "transferECR20",
      args: [
        ethers.utils.parseUnits(amount.toString(), "ether"),
        accountAddress,
        tokenAddress,
      ],
    });
    setForceUpdate(true);
    setAmount(0);
    setModalOpen2(false);
    setModalOpen4(false);
  };

  useEffect(() => {
    if (!cardPhysicalBalance || isDisconnected || accountAddress === undefined)
      return;
    setCardPhysicalBalance(
      parseFloat(
        ethers.utils.formatUnits(
          cardPhysicalBalance,
          tokenData.GHO.tokenDecimals
        )
      ).toFixed(2)
    );
  }, [cardPhysicalBalance, accountAddress, isDisconnected]);

  useEffect(() => {
    if (!cardVirtualBalance || isDisconnected || accountAddress === undefined)
      return;
    setCardVirtualBalance(
      parseFloat(
        ethers.utils.formatUnits(
          cardVirtualBalance,
          tokenData.GHO.tokenDecimals
        )
      ).toFixed(2)
    );
  }, [cardVirtualBalance, accountAddress, isDisconnected]);

  useEffect(() => {
    if (!collateralAsset || isDisconnected || accountAddress === undefined)
      return;
    setChainBalance(
      parseFloat(ethers.utils.formatUnits(collateralAsset[0], 8)).toFixed(2)
    );
  }, [collateralAsset, accountAddress, isDisconnected]);

  // Catch Balance and Setup Tokens

  useEffect(() => {
    if (!tokenBalances || isDisconnected || accountAddress === undefined)
      return;
    const zeros = convertJsonToArray(tokenData, "tokenDecimals");
    const balances = tokenBalances.map((b, i) =>
      parseFloat(ethers.utils.formatUnits(b, zeros[i])).toFixed(4)
    );
    setTokenBalancesArray(balances);
  }, [tokenBalances, accountAddress, isDisconnected]);

  if (isMobile) {
    return (
      <div className="container">
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen1(!modalOpen1)}
          onClosed={() => setAmount(0)}
          isOpen={modalOpen1}
        >
          <div
            className="mainCardMobile"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                margin: "30px",
                justifyContent: "center",
                width: "100%",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <h2>Add GHO to Virtual Card</h2>
              <input
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "80%",
                  border: "1px solid #d9d9d9",
                  fontSize: "20px",
                  padding: "10px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
                placeholder="Amount in USD"
                type="number"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() =>
                    addBalance(
                      amount,
                      "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                      tokenData.GHO.tokenAddress
                    )
                  }
                >
                  <div>Add Balance</div>
                </button>
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() => setModalOpen1(!modalOpen1)}
                >
                  <div>Cancel</div>
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen2(!modalOpen2)}
          isOpen={modalOpen2}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCardMobile"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                margin: "30px",
                justifyContent: "center",
                width: "100%",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <h2>Remove GHO to Virtual Card</h2>
              <input
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "80%",
                  border: "1px solid #d9d9d9",
                  fontSize: "20px",
                  padding: "10px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
                placeholder="Amount in USD"
                type="number"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() =>
                    removeBalance(
                      amount,
                      "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                      tokenData.GHO.tokenAddress
                    )
                  }
                >
                  <div>Remove Balance</div>
                </button>
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() => setModalOpen2(!modalOpen2)}
                >
                  <div>Cancel</div>
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen3(!modalOpen3)}
          isOpen={modalOpen3}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCardMobile"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                margin: "30px",
                justifyContent: "center",
                width: "100%",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <h2>Add GHO to Physical Card</h2>
              <input
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "80%",
                  border: "1px solid #d9d9d9",
                  fontSize: "20px",
                  padding: "10px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
                placeholder="Amount in USD"
                type="number"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() =>
                    addBalance(
                      amount,
                      "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                      tokenData.GHO.tokenAddress
                    )
                  }
                >
                  <div>Add Balance</div>
                </button>
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() => setModalOpen3(!modalOpen3)}
                >
                  <div>Cancel</div>
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen4(!modalOpen4)}
          isOpen={modalOpen4}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCardMobile"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                margin: "30px",
                justifyContent: "center",
                width: "100%",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <h2>Remove GHO to Physical Card</h2>
              <input
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "80%",
                  border: "1px solid #d9d9d9",
                  fontSize: "20px",
                  padding: "10px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
                placeholder="Amount in USD"
                type="number"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() =>
                    removeBalance(
                      amount,
                      "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                      tokenData.GHO.tokenAddress
                    )
                  }
                >
                  <div>Remove Balance</div>
                </button>
                <button
                  className="buttons"
                  style={{
                    width: "40%",
                  }}
                  onClick={() => setModalOpen4(!modalOpen4)}
                >
                  <div>Cancel</div>
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <div className="customHeader">
          <div className="titleHeaderMobile">
            <Image
              src={logo}
              alt="logo"
              style={{ width: "auto", height: "30px", marginRight: "10px" }}
            />
            {process.env.NEXT_PUBLIC_APPNAME}
          </div>
          <ConnectKitButton customTheme={{ ...customThemeDashboardMobile }} />
        </div>
        <div className="customBody">
          <div
            style={{
              width: "80%",
              display: "flex",
              justifyContent: "center",
              backgroundColor: "white",
              padding: "4px",
              margin: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            <button
              className={showAssets ? "buttons2" : "buttons3"}
              style={{
                width: "50%",
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                flexDirection: "column",
              }}
              onClick={() => setShowAssets(true)}
            >
              <div>Assets</div>
            </button>
            <button
              className={!showAssets ? "buttons2" : "buttons3"}
              style={{
                width: "50%",
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                flexDirection: "column",
              }}
              onClick={() => setShowAssets(false)}
            >
              <div>Cards</div>
            </button>
          </div>
          <div className="mainCardMobile">
            {showAssets ? (
              <div className="cardSecMobile">
                <h3>Total Supplied {"\n"}</h3>
                <h1 style={{ marginTop: "-10px" }}>${chainBalance}</h1>
                <h3>Borrowed Tokens</h3>
                {tokenBalancesArray &&
                  Object.keys(tokenData).map((t, i) => {
                    const fontSize = "1.4rem";
                    if (tokenBalancesArray[i] > 0) {
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-around",
                            width: "100%",
                            fontWeight: "bold",
                            fontSize,
                            backgroundColor: "white",
                            border: "1px solid #d9d9d9",
                            borderWidth: `${
                              i === 0 ? "1px" : "0px"
                            } 0px 1px 0px`,
                            borderRadius: "10px",
                            padding: "10px 40px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <Image
                              src={tokenData[t].tokenIcon}
                              alt={t}
                              style={{ width: fontSize, height: fontSize }}
                            />
                            <div> {t} </div>
                          </div>
                          <div> {tokenBalancesArray[i]} </div>
                        </div>
                      );
                    } else {
                      return <React.Fragment key={i}></React.Fragment>;
                    }
                  })}
              </div>
            ) : (
              <div className="cardSecMobile">
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    flexDirection: "column",
                  }}
                >
                  <h4 style={{ width: "100%", height: "20%" }}>
                    {" "}
                    Virtual Card{" "}
                    <MdSwitchAccessShortcut
                      color="black"
                      onClick={() => setShowCardVirtual(!showCardVirtual)}
                      style={{ rotate: showCardVirtual ? "180deg" : "0deg" }}
                    />
                  </h4>
                  <div
                    style={{
                      height: "80%",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {!showCardVirtual ? (
                      <>
                        <h3>{`GHO Balance: $${virtualBalance} USD`}</h3>
                        <CardCointainer
                          last={`..${card.cardNumber.substring(
                            card.cardNumber.length - 4
                          )}`}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-evenly",
                            alignItems: "center",
                            flexDirection: "row",
                            width: "100%",
                          }}
                        >
                          <button
                            className="buttonsAdd"
                            style={{
                              width: "40%",
                              display: "flex",
                              justifyContent: "space-evenly",
                              alignItems: "center",
                              flexDirection: "column",
                            }}
                            onClick={() => setModalOpen1(!modalOpen1)}
                          >
                            <div>Add</div>
                            <div>Balance</div>
                          </button>
                          <button
                            className="buttonsRemove"
                            style={{
                              width: "40%",
                              display: "flex",
                              justifyContent: "space-evenly",
                              alignItems: "center",
                              flexDirection: "column",
                            }}
                            onClick={() => setModalOpen2(!modalOpen2)}
                            /**
                          onClick={() =>
                            removeBalance(
                              0.1,
                              "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                              tokenData.GHO.tokenAddress
                            )
                          }
                        */
                          >
                            <div>Remove</div>
                            <div>Balance</div>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            marginTop: "20px",
                            padding: "20px 0px",
                            height: "50%",
                            width: "100%",
                            borderRadius: "10px",
                            background: "whitesmoke",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Card Number: {card.cardNumber}
                        </div>
                        <div
                          style={{
                            height: "1px",
                            width: "90%",
                            marginLeft: "5%",
                            background: "gray",
                          }}
                        />
                        <div
                          style={{
                            padding: "20px 0px",
                            height: "50%",
                            width: "100%",
                            borderRadius: "10px",
                            background: "whitesmoke",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontWeight: "bold",
                          }}
                        >
                          <div>Expiry Date: 01/27</div>
                          <div>CVV: {card.cvv}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "30px",
                    marginBottom: "30px",
                    borderTopWidth: "1px",
                    borderTopStyle: "solid",
                    borderTopColor: "#d9d9d9",
                    height: "auto",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                  }}
                >
                  <h4>Physical Card</h4>
                  <div
                    style={{
                      height: "80%",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <h3>{`GHO Balance: $${physicalBalance} USD`}</h3>
                    <CardCointainer last="4599.." />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        flexDirection: "row",
                        width: "100%",
                      }}
                    >
                      <button
                        className="buttonsAdd"
                        style={{
                          width: "40%",
                          display: "flex",
                          justifyContent: "space-evenly",
                          alignItems: "center",
                          flexDirection: "column",
                        }}
                        onClick={() => setModalOpen3(!modalOpen3)}
                      >
                        <div>Add</div>
                        <div>Balance</div>
                      </button>
                      <button
                        className="buttonsRemove"
                        style={{
                          width: "40%",
                          display: "flex",
                          justifyContent: "space-evenly",
                          alignItems: "center",
                          flexDirection: "column",
                        }}
                        onClick={() => setModalOpen4(!modalOpen4)}
                        /**
                      onClick={() =>
                        removeBalance(
                          0.1,
                          "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                          tokenData.GHO.tokenAddress
                        )
                      }
                    */
                      >
                        <div>Remove</div>
                        <div>Balance</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="container">
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen1(!modalOpen1)}
          onClosed={() => setAmount(0)}
          isOpen={modalOpen1}
        >
          <div
            className="mainCard"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <h1>Add GHO to Virtual Card</h1>
            <input
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "90%",
                border: "1px solid #d9d9d9",
                fontSize: "20px",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "10px",
              }}
              placeholder="Amount in USD"
              type="number"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() =>
                  addBalance(
                    amount,
                    "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                    tokenData.GHO.tokenAddress
                  )
                }
              >
                <div>Add Balance</div>
              </button>
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() => setModalOpen1(!modalOpen1)}
              >
                <div>Cancel</div>
              </button>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen2(!modalOpen2)}
          isOpen={modalOpen2}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCard"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <h1>Remove GHO to Virtual Card</h1>
            <input
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "90%",
                border: "1px solid #d9d9d9",
                fontSize: "20px",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "10px",
              }}
              placeholder="Amount in USD"
              type="number"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() =>
                  removeBalance(
                    amount,
                    "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                    tokenData.GHO.tokenAddress
                  )
                }
              >
                <div>Remove Balance</div>
              </button>
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() => setModalOpen2(!modalOpen2)}
              >
                <div>Cancel</div>
              </button>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen3(!modalOpen3)}
          isOpen={modalOpen3}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCard"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <h1>Add GHO to Physical Card</h1>
            <input
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "90%",
                border: "1px solid #d9d9d9",
                fontSize: "20px",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "10px",
              }}
              placeholder="Amount in USD"
              type="number"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() =>
                  addBalance(
                    amount,
                    "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                    tokenData.GHO.tokenAddress
                  )
                }
              >
                <div>Add Balance</div>
              </button>
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() => setModalOpen3(!modalOpen3)}
              >
                <div>Cancel</div>
              </button>
            </div>
          </div>
        </Modal>
        <Modal
          style={{
            position: "fixed",
            top: 0,
            backgroundColor: "#000000aa",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          toggle={() => setModalOpen4(!modalOpen4)}
          isOpen={modalOpen4}
          onClosed={() => setAmount(0)}
        >
          <div
            className="mainCard"
            style={{ flexDirection: "column", width: "100%" }}
          >
            <h1>Remove GHO to Physical Card</h1>
            <input
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "90%",
                border: "1px solid #d9d9d9",
                fontSize: "20px",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "10px",
              }}
              placeholder="Amount in USD"
              type="number"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() =>
                  removeBalance(
                    amount,
                    "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                    tokenData.GHO.tokenAddress
                  )
                }
              >
                <div>Remove Balance</div>
              </button>
              <button
                className="buttons"
                style={{
                  width: "45%",
                }}
                onClick={() => setModalOpen4(!modalOpen4)}
              >
                <div>Cancel</div>
              </button>
            </div>
          </div>
        </Modal>
        <div className="customHeader">
          <div className="titleHeader">Dashboard</div>
          <ConnectKitButton customTheme={{ ...customThemeDashboard }} />
        </div>
        <div className="customBody">
          <div className="mainCard">
            <div
              className="cardSec"
              style={{
                borderRight: "1px solid #d9d9d9",
                borderTopRightRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
            >
              <h1>
                Total Supplied {"\n"}${chainBalance}
              </h1>
              <h1>Borrowed Tokens</h1>
              {tokenBalancesArray &&
                Object.keys(tokenData).map((t, i) => {
                  const fontSize = "1.4rem";
                  if (tokenBalancesArray[i] > 0) {
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "90%",
                          fontWeight: "bold",
                          fontSize,
                          backgroundColor: "white",
                          border: "4px solid black",
                          borderRadius: "10px",
                          padding: "6px",
                        }}
                      >
                        <Image
                          src={tokenData[t].tokenIcon}
                          alt={t}
                          style={{ width: fontSize, height: fontSize }}
                        />
                        <div> {t} </div>
                        <div> {tokenBalancesArray[i]} </div>
                      </div>
                    );
                  } else {
                    return <React.Fragment key={i}></React.Fragment>;
                  }
                })}
            </div>
            <div className="cardSec">
              <div
                style={{
                  height: "40%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "20%",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  <> Virtual Card </>
                  <MdSwitchAccessShortcut
                    color="black"
                    onClick={() => setShowCardVirtual(!showCardVirtual)}
                    style={{ rotate: showCardVirtual ? "180deg" : "0deg" }}
                  />
                </div>
                <div style={{ height: "80%", width: "100%" }}>
                  {!showCardVirtual ? (
                    <>
                      <h3>{`GHO Balance: $${virtualBalance} USD`}</h3>
                      <CardCointainer
                        last={`..${card.cardNumber.substring(
                          card.cardNumber.length - 4
                        )}`}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-evenly",
                          alignItems: "center",
                          flexDirection: "row",
                        }}
                      >
                        <button
                          className="buttons"
                          style={{
                            width: "40%",
                            display: "flex",
                            justifyContent: "space-evenly",
                            alignItems: "center",
                            flexDirection: "column",
                          }}
                          onClick={() => setModalOpen1(!modalOpen1)}
                          /**
                          onClick={() =>
                            addBalance(
                              0.1,
                              "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                              tokenData.GHO.tokenAddress
                            )
                          }
                        */
                        >
                          <div>Add</div>
                          <div>Balance</div>
                        </button>
                        <button
                          className="buttons"
                          style={{
                            width: "40%",
                            display: "flex",
                            justifyContent: "space-evenly",
                            alignItems: "center",
                            flexDirection: "column",
                          }}
                          onClick={() => setModalOpen2(!modalOpen2)}
                          /**
                          onClick={() =>
                            removeBalance(
                              0.1,
                              "0x2C20CeE6268422e8d15dea1E66598cd04c92bbAe",
                              tokenData.GHO.tokenAddress
                            )
                          }
                        */
                        >
                          <div>Remove</div>
                          <div>Balance</div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          height: "50%",
                          width: "100%",
                          borderRadius: "10px",
                          background: "whitesmoke",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                        }}
                      >
                        Card Number: {card.cardNumber}
                      </div>
                      <div
                        style={{
                          height: "1px",
                          width: "90%",
                          marginLeft: "5%",
                          background: "gray",
                        }}
                      />
                      <div
                        style={{
                          height: "50%",
                          width: "100%",
                          borderRadius: "10px",
                          background: "whitesmoke",
                          display: "flex",
                          justifyContent: "space-around",
                          alignItems: "center",
                          flexDirection: "row",
                          fontWeight: "bold",
                        }}
                      >
                        <div>Expiry Date: 01/27</div>
                        <div>CVV: {card.cvv}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div
                style={{ height: "1px", width: "100%", background: "#d9d9d9" }}
              />
              <div
                style={{
                  height: "40%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "20%",
                    width: "100%",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  <> Physical Card </>
                </div>
                <div style={{ height: "80%", width: "100%" }}>
                  <h3>{`GHO Balance: $${physicalBalance} USD`}</h3>
                  <CardCointainer last="4599.." />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-evenly",
                      alignItems: "center",
                      flexDirection: "row",
                    }}
                  >
                    <button
                      className="buttons"
                      style={{
                        width: "40%",
                        display: "flex",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                      onClick={() => setModalOpen3(!modalOpen3)}
                      /**
                      onClick={() =>
                        addBalance(
                          0.1,
                          "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                          tokenData.GHO.tokenAddress
                        )
                      }
                    */
                    >
                      <div>Add</div>
                      <div>Balance</div>
                    </button>
                    <button
                      className="buttons"
                      style={{
                        width: "40%",
                        display: "flex",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                      onClick={() => setModalOpen4(!modalOpen4)}
                      /**
                      onClick={() =>
                        removeBalance(
                          0.1,
                          "0x4017cFEcE25FE7e9038Db1CA641b4B4A9640a15B",
                          tokenData.GHO.tokenAddress
                        )
                      }
                    */
                    >
                      <div>Remove</div>
                      <div>Balance</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="customFooter"></div>
      </div>
    );
  }
}

export async function getServerSideProps() {
  const card = generateDummyCreditCard();
  return { props: { card } };
}
