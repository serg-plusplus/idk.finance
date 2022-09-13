import "regenerator-runtime/runtime";

import React from "react";
// import { Card, Grid, Text, Link } from "@nextui-org/react";

import "./assets/global.css";

import { EducationalText, SignInPrompt, SignOutButton } from "./ui-components";
import Chart from "./chart/Chart";
import { ChartData, getChartData } from "./chart/chart-data";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";

const App: React.FC = () => {
  const { isSignedIn, wallet, getState } = useIdkState();

  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();
  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);
  const [coingeckoData, setCoingeckoData] = React.useState<ChartData>({
    prices: [],
  });

  // Get blockchian state once on component load
  React.useEffect(() => {
    getState().then(console.info).catch(console.error);
    // getState
    //   .then(setValueFromBlockchain)
    //   .catch(alert)
    //   .finally(() => {
    //     setUiPleaseWait(false);
    //   });

    getChartData().then(setCoingeckoData);
  }, []);

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    return (
      <>
        <SignInPrompt
          greeting={valueFromBlockchain}
          onClick={() => wallet.signIn()}
        />
      </>
    );
  }

  function changeGreeting(e) {
    e.preventDefault();
    setUiPleaseWait(true);
    const { greetingInput } = e.target.elements;
    // contract
    //   .setGreeting(greetingInput.value)
    //   .then(async () => {
    //     return contract.getGreeting();
    //   })
    //   .then(setValueFromBlockchain)
    //   .finally(() => {
    //     setUiPleaseWait(false);
    //   });
  }

  return (
    <>
      <Header />
      <SignOutButton
        accountId={wallet.accountId}
        onClick={() => wallet.signOut()}
      />
      <main className={uiPleaseWait ? "please-wait" : ""}>
        {coingeckoData.prices.length && (
          <Chart
            margin={{ top: 10, bottom: 0, left: 0, right: 0 }}
            stock={coingeckoData}
            width={400}
            height={300}
          />
        )}

        <EducationalText />
      </main>
    </>
  );
};

export default App;
