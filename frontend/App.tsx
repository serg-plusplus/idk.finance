import "regenerator-runtime/runtime";
import { FC } from "react";
import { Container, Card, Grid, Text, Link } from "@nextui-org/react";

import "./assets/global.css";

import { SignInPrompt } from "./ui-components";
import Chart from "./chart/Chart2";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";
import Panel from "./Panel/Panel";

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

          <Panel />
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
