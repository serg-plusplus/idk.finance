import React from "react";
import { createRoot } from "react-dom/client";

import { NextUIProvider, createTheme } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import App from "./App";
import { Wallet } from "./near-wallet";
import { Contract } from "./near-interface";
import { IdkStateProvider } from "./idk-state";

const lightTheme = createTheme({
  type: "light",
  theme: {
    // colors: {...}, // optional
  },
});

const darkTheme = createTheme({
  type: "dark",
  theme: {
    // colors: {...}, // optional
  },
});

const reactRoot = createRoot(document.querySelector("#root"));

const renderApp = (children) =>
  reactRoot.render(
    <NextThemesProvider
      defaultTheme="system"
      attribute="class"
      value={{
        light: lightTheme.className,
        dark: darkTheme.className,
      }}
    >
      <NextUIProvider>{children}</NextUIProvider>
    </NextThemesProvider>
  );

// create the Wallet and the Contract
const contractId = process.env.CONTRACT_NAME;
const wallet = new Wallet({ contractId: contractId });
const contract = new Contract({ wallet: wallet });

window.onload = wallet
  .startUp()
  .then((isSignedIn) => {
    renderApp(
      <IdkStateProvider
        isSignedIn={isSignedIn}
        contract={contract}
        wallet={wallet}
      >
        <App />
      </IdkStateProvider>
    );
  })
  .catch((e) => {
    renderApp(
      <div style={{ color: "red" }}>
        Error: <code>{e.message}</code>
      </div>
    );
    console.error(e);
  });
