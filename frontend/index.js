import React from "react";
import { createRoot } from "react-dom/client";

import { NextUIProvider } from "@nextui-org/react";
import App from "./App";
import { Wallet } from "./near-wallet";
import { Contract } from "./near-interface";
import { IdkStateProvider } from "./idk-state";

const reactRoot = createRoot(document.querySelector("#root"));

// create the Wallet and the Contract
const contractId = process.env.CONTRACT_NAME;
const wallet = new Wallet({ contractId: contractId });
const contract = new Contract({ wallet: wallet });

window.onload = wallet
  .startUp()
  .then((isSignedIn) => {
    reactRoot.render(
      <NextUIProvider>
        <IdkStateProvider
          isSignedIn={isSignedIn}
          contract={contract}
          wallet={wallet}
        >
          <App />
        </IdkStateProvider>
      </NextUIProvider>
    );
  })
  .catch((e) => {
    reactRoot.render(
      <div style={{ color: "red" }}>
        Error: <code>{e.message}</code>
      </div>
    );
    console.error(e);
  });
