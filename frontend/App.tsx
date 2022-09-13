import "regenerator-runtime/runtime";
import React from "react";
import { FC, useEffect, useState } from "react";
import { Card, Container, Grid, Text, Link } from "@nextui-org/react";

import "./assets/global.css";

import { SignInPrompt } from "./ui-components";
import Chart from "./chart/Chart2";
import { ChartData, getChartData } from "./chart/chart-data";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";

const App: FC = () => {
  const { isSignedIn, wallet, state, latestRounds } = useIdkState();

  const [valueFromBlockchain, setValueFromBlockchain] = useState();
  const [uiPleaseWait, setUiPleaseWait] = useState(false);
  const [coingeckoData, setCoingeckoData] = useState<ChartData>({
    prices: [],
  });

  // Get blockchian state once on component load
  useEffect(() => {
    // getState().then(console.info).catch(console.error);
    // getState
    //   .then(setValueFromBlockchain)
    //   .catch(alert)
    //   .finally(() => {
    //     setUiPleaseWait(false);
    //   });

    getChartData().then(setCoingeckoData);
  }, []);

  useEffect(() => {
    console.info("State changed: ", state);
    console.info("Latest rounds: ", state);
  }, [state, latestRounds]);

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
      <main className={uiPleaseWait ? "please-wait" : "main-trade"}>
        <Container display="flex" justify="center">
          {coingeckoData.prices.length && (
            <Chart stock={coingeckoData} width={1200} height={400} />
          )}

          {state && latestRounds?.length && (
            <Card css={{ p: "$6", mw: "1200px" }}>
              <Card.Header>
                {/* <Text size={50}>ѻ</Text> */}
                <Grid.Container>
                  <Grid xs={12}>
                    <Text h2 css={{ lineHeight: "$xs" }}>
                      Current round #{state.currentEpoch.toFixed()}
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Total amount: {latestRounds[0].totalAmount}
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Bears staked: {latestRounds[0].bearAmount}
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Bulls staked: {latestRounds[0].bullAmount}
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Close timestamp: {latestRounds[0].closeTimestamp}
                    </Text>
                  </Grid>
                </Grid.Container>
              </Card.Header>
              <Card.Body css={{ py: "$2" }}>
                <Text>
                  Make beautiful websites regardless of your design experience.
                </Text>
              </Card.Body>
              <Card.Footer>
                <Link
                  color="primary"
                  target="_blank"
                  href="https://github.com/nextui-org/nextui"
                >
                  Visit source code on GitHub.
                </Link>
              </Card.Footer>
            </Card>
          )}
        </Container>
      </main>
    </>
  );
};

export default App;
