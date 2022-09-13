import "regenerator-runtime/runtime";
import {FC, useEffect, useState} from "react";
import {Container} from "@nextui-org/react";

import "./assets/global.css";

import { SignInPrompt } from "./ui-components";
import Chart from "./chart/Chart2";
import { ChartData, getChartData } from "./chart/chart-data";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";

const App: FC = () => {
  const { isSignedIn, wallet, getState } = useIdkState();

  const [valueFromBlockchain, setValueFromBlockchain] = useState();
  const [uiPleaseWait, setUiPleaseWait] = useState(false);
  const [coingeckoData, setCoingeckoData] = useState<ChartData>({
    prices: [],
  });

  // Get blockchian state once on component load
  useEffect(() => {
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
      <Header/>
      <main className={uiPleaseWait ? "please-wait" : "main-trade"}>
        <Container display="flex" justify="center">
          {coingeckoData.prices.length && (
            <Chart
              stock={coingeckoData}
              width={1200}
              height={400}
            />
          )}
        </Container>
      </main>
    </>
  );
};

export default App;
