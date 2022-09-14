import "regenerator-runtime/runtime";
import {FC, useMemo} from "react";
import { Container } from "@nextui-org/react";

import "./assets/global.css";

import { SignInPrompt } from "./ui-components";
import Chart from "./chart/Chart2";
import { useIdkState } from "./idk-state";
import Header from "./Header/Header";
import Panel from "./Panel/Panel";

const App: FC = () => {
  const { isSignedIn, wallet, chartData, latestRounds } = useIdkState();

  const finalLatestRounds = useMemo(() => latestRounds ? latestRounds.filter(el => el.lockPrice !== '0').map((el) => ({time: +(+el.lockTimestamp/1e6).toFixed(), price: +el.lockPrice/1e4, ...el})) : [], [latestRounds])

  const finalChartData = useMemo(() => (
    chartData && chartData.prices.length
      ? [
        ...chartData.prices.map((el) => ({time: el[0], price: el[1]})),
        ...finalLatestRounds,
      ].sort((a, b) => a.time - b.time)
      : []
    ), [chartData, finalLatestRounds])

  let content;

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    content = <SignInPrompt onClick={() => wallet.signIn()} />;
  } else if (finalChartData) {
    content = (
      <main>
        <Container display="flex" justify="center" css={{ mw: "1248px" }}>
          {finalChartData.length && (
            <Chart stock={finalChartData} rounds={finalLatestRounds} width={1200} height={400} />
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
