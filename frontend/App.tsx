import "regenerator-runtime/runtime";

import React from "react";
// import { Card, Grid, Text, Link } from "@nextui-org/react";

import "./assets/global.css";

import { EducationalText, SignInPrompt, SignOutButton } from "./ui-components";
import Chart from "./chart/Chart";
import { ChartData, getChartData } from "./chart/chart-data";
import { useIdkState } from "./idk-state";

const App: React.FC = () => {
  const { isSignedIn, contract, wallet } = useIdkState();

  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();
  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);
  const [coingeckoData, setCoingeckoData] = React.useState<ChartData>({
    prices: [],
  });

  // Get blockchian state once on component load
  React.useEffect(() => {
    contract
      .getGreeting()
      .then(setValueFromBlockchain)
      .catch(alert)
      .finally(() => {
        setUiPleaseWait(false);
      });

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

        {/*<Card css={{ p: "$6", mw: "400px" }}>*/}
        {/*  <Card.Header>*/}
        {/*    <img*/}
        {/*      alt="nextui logo"*/}
        {/*      src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"*/}
        {/*      width="34px"*/}
        {/*      height="34px"*/}
        {/*    />*/}
        {/*    <Grid.Container css={{ pl: "$6" }}>*/}
        {/*      <Grid xs={12}>*/}
        {/*        <Text h4 css={{ lineHeight: "$xs" }}>*/}
        {/*          Next UI*/}
        {/*        </Text>*/}
        {/*      </Grid>*/}
        {/*      <Grid xs={12}>*/}
        {/*        <Text css={{ color: "$accents8" }}>nextui.org</Text>*/}
        {/*      </Grid>*/}
        {/*    </Grid.Container>*/}
        {/*  </Card.Header>*/}
        {/*  <Card.Body css={{ py: "$2" }}>*/}
        {/*    <Text>*/}
        {/*      Make beautiful websites regardless of your design experience.*/}
        {/*    </Text>*/}
        {/*  </Card.Body>*/}
        {/*  <Card.Footer>*/}
        {/*    <Link*/}
        {/*      icon*/}
        {/*      color="primary"*/}
        {/*      target="_blank"*/}
        {/*      href="https://github.com/nextui-org/nextui"*/}
        {/*    >*/}
        {/*      Visit source code on GitHub.*/}
        {/*    </Link>*/}
        {/*  </Card.Footer>*/}
        {/*</Card>*/}
      </>
    );
  }

  function changeGreeting(e) {
    e.preventDefault();
    setUiPleaseWait(true);
    const { greetingInput } = e.target.elements;
    contract
      .setGreeting(greetingInput.value)
      .then(async () => {
        return contract.getGreeting();
      })
      .then(setValueFromBlockchain)
      .finally(() => {
        setUiPleaseWait(false);
      });
  }

  console.info("KEK");

  return (
    <>
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
