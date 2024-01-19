import React from "react";
import visa from "../assets/visa.png";
import Image from "next/image";
import { isMobile } from "react-device-detect";

export default function CardCointainer(props) {
  if (isMobile) {
    return (
      <div className="cardInfoMobile">
        <div
          style={{
            height: "100%",
            width: "15%",
            background: "white",
            borderRadius: "10px 0px 10px 10px",
            borderEndEndRadius: "0px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: "black",
              borderTopRightRadius: "10px",
              borderEndEndRadius: "0px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Image
              src={visa}
              alt="Visa"
              style={{
                width: "90%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
        <div
          style={{
            height: "100%",
            width: "85%",
            background: "white",
            borderRadius: "0px 10px 10px 10px",
            paddingRight: "5px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            fontWeight: "bold",
            fontFamily: "monospace",
            fontSize: "20px",
          }}
        >
          {props.last}
        </div>
      </div>
    );
  } else {
    return (
      <div className="cardInfo">
        <div
          style={{
            height: "100%",
            width: "15%",
            background: "white",
            borderRadius: "10px 0px 10px 10px",
            borderEndEndRadius: "0px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: "black",
              borderTopRightRadius: "10px",
              borderEndEndRadius: "0px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Image
              src={visa}
              alt="Visa"
              style={{
                width: "90%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
        <div
          style={{
            height: "100%",
            width: "85%",
            background: "white",
            borderRadius: "0px 10px 10px 10px",
            paddingRight: "5px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            fontWeight: "bold",
            fontFamily: "monospace",
            fontSize: "20px",
          }}
        >
          {props.last}
        </div>
      </div>
    );
  }
}
