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

  const finalLatestRounds = useMemo(() => latestRounds ? latestRounds.map((el, index) => {
    if (el.lockPrice !== '0' && latestRounds[index + 1]) {
      const prevElement = latestRounds[index + 1];
      return ({
        time: +(+el.lockTimestamp / 1e6).toFixed(),
        price: +el.lockPrice / 1e4,
        diff: +prevElement.lockPrice * 100 / +prevElement.closePrice,
        totalAmount: prevElement.totalAmount,
        rewardAmount: prevElement.rewardAmount,
        ...el,
      })
    } else {
      return null;
    }
  }).filter(el => el !== null) : [], [latestRounds])

  const finalChartData = useMemo(() => (
    chartData && chartData.prices.length
      ? [
        ...chartData.prices.map((el) => ({time: el[0], price: el[1]})),
        ...finalLatestRounds,
      ].sort((a, b) => a.time - b.time).slice(-200)
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
