import "regenerator-runtime/runtime";
import { FC } from "react";
import { Container, Card, Grid, Text, Link } from "@nextui-org/react";

import "./assets/global.css";

import { SignInPrompt } from "./ui-components";
import Chart from "./chart/Chart2";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";

const App: FC = () => {
  const { isSignedIn, wallet, chartData, state, latestRounds } = useIdkState();

  let content;

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    content = <SignInPrompt onClick={() => wallet.signIn()} />;
  } else if (chartData) {
    content = (
      <main>
        <Container display="flex" justify="center" css={{ mw: "1248px" }}>
          {chartData.prices.length && (
            <Chart stock={chartData} width={1200} height={400} />
          )}

          {state && latestRounds?.length && (
            <Card css={{ p: "$6", marginTop: 16 }}>
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
    );
  } else {
    content = null;
  }

  return (
    <>
      <Header isSignedIn={isSignedIn} />
      <div style={{ paddingTop: 100 }} />
      {content}
    </>
  );
};

export default App;
