import React, { FC, Fragment, useCallback } from "react";
import { format } from "timeago.js";
import BigNumber from "bignumber.js";
import {
  Button,
  Container,
  Row,
  Spacer,
  useTheme,
  changeTheme,
  Card,
  Grid,
  Text,
  Link,
  Input,
  Radio,
} from "@nextui-org/react";
import { useIdkState } from "../idk-state";

const Panel: FC = () => {
  const { state, latestRounds, bet } = useIdkState();

  const handleBetSubmit = useCallback((evt) => {
    evt.preventDefault();

    const amount = evt.target.elements.amount.value;
    const position = evt.target.elements.position.value;

    if (!amount) return;

    bet(position, amount)
      .then(() => alert("Success!"))
      .catch((err) => {
        console.error(err);
        alert(err.message);
      });
  }, []);

  if (!state || !latestRounds?.length) return null;

  const [currentRound, prevRound] = latestRounds;

  return (
    <>
      <Grid.Container gap={2} justify="center">
        <Grid xs={4}>
          {prevRound && (
            <Card css={{ p: "$6", marginTop: 16 }}>
              <Card.Header>
                {/* <Text size={50}>ѻ</Text> */}
                <Grid.Container>
                  <Grid xs={12}>
                    <Text h2 css={{ lineHeight: "$xs" }}>
                      Current round #{state.currentEpoch - 1}
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
              <Card.Footer></Card.Footer>
            </Card>
          )}
        </Grid>
        <Grid xs={4}>
          <Card css={{ p: "$6", marginTop: 16 }}>
            <form onSubmit={handleBetSubmit}>
              <Card.Header>
                <Grid.Container>
                  <Grid xs={12}>
                    <Text h2 css={{ lineHeight: "$xs" }}>
                      Next round #{state.currentEpoch.toFixed()}
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Started at:{" "}
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 4, display: "inline-block" }}
                      >
                        {format(toDate(currentRound.lockTimestamp))}
                      </Text>
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Period:{" "}
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 4,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        {format(toDate(currentRound.lockTimestamp))}
                      </Text>
                      -
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 8, display: "inline-block" }}
                      >
                        {format(toDate(currentRound.closeTimestamp))}
                      </Text>
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Total taked:{" "}
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 4,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        {toNear(latestRounds[0].bearAmount)}
                      </Text>
                      /
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 8, display: "inline-block" }}
                      >
                        {toNear(latestRounds[0].bullAmount)}
                      </Text>
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Your stake:{" "}
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 4,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        {toNear(latestRounds[0].bearAmount)}
                      </Text>
                    </Text>
                  </Grid>
                </Grid.Container>
              </Card.Header>
              <Card.Body css={{ py: "$2" }}>
                <Input
                  name="amount"
                  bordered
                  placeholder="0.00"
                  label="Amount"
                  size="lg"
                />

                <Radio.Group
                  label="Bet for"
                  defaultValue="2"
                  orientation="horizontal"
                  color="secondary"
                  css={{ marginTop: 24 }}
                  name="position"
                >
                  <Radio value="1" description="🔻 Price down">
                    Bears
                  </Radio>
                  <Radio value="2" description="🔺 Price up">
                    Bulls
                  </Radio>
                </Radio.Group>
              </Card.Body>
              <Card.Footer css={{ marginTop: 16 }}>
                <Button
                  type="submit"
                  shadow
                  color="gradient"
                  auto
                  size="lg"
                  css={{ width: "100%" }}
                >
                  Bet
                </Button>
              </Card.Footer>
            </form>
          </Card>
        </Grid>
        <Grid xs={4}>
          <Card css={{ p: "$6", marginTop: 16 }}>
            <form onSubmit={handleBetSubmit}>
              <Card.Header>
                <Text h2 css={{ lineHeight: "$xs" }}>
                  My bets
                </Text>
              </Card.Header>
              <Card.Body css={{ py: "$2" }}></Card.Body>
              <Card.Footer css={{ marginTop: 16 }}></Card.Footer>
            </form>
          </Card>
        </Grid>
      </Grid.Container>
    </>
  );
};

export default Panel;

const toNear = (amount: BigNumber.Value) =>
  new BigNumber(amount)
    .div("1000000000000000000000000")
    .toFixed(4, BigNumber.ROUND_UP)
    .toString();

const toDate = (timestamp: BigNumber.Value) =>
  new BigNumber(timestamp).idiv(1_000_000).toNumber();
