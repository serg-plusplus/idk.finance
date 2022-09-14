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
  Checkbox,
} from "@nextui-org/react";
import { useIdkState } from "../idk-state";

const Panel: FC = () => {
  const { state, latestRounds, bet, claim, userBids, userRounds } =
    useIdkState();

  const sortedBidKeys = userRounds ? userRounds.sort((a, b) => b - a) : [];

  const handleBetSubmit = useCallback(
    (evt) => {
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
    },
    [bet]
  );

  const handleClaimSubmit = useCallback(
    (epoch) => {
      if (!epoch) return;

      claim([epoch])
        .then(() => alert("Successfully claimed!"))
        .catch((err) => {
          console.error(err);
          alert(err.message);
        });
    },
    [claim]
  );

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
                      Started at:{" "}
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 4, display: "inline-block" }}
                      >
                        {format(toDate(prevRound.startTimestamp))}
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
                        {format(toDate(prevRound.lockTimestamp))}
                      </Text>
                      -
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 8, display: "inline-block" }}
                      >
                        {format(toDate(prevRound.closeTimestamp))}
                      </Text>
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Total staked:{" "}
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 4,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        {toNear(prevRound.bearAmount)}
                      </Text>
                      /
                      <Text
                        weight="semibold"
                        css={{ marginLeft: 8, display: "inline-block" }}
                      >
                        {toNear(prevRound.bullAmount)}
                      </Text>
                    </Text>
                  </Grid>
                  <Grid xs={12}>
                    <Text css={{ color: "$accents8" }}>
                      Lock price:{" "}
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 4,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        ${Number(prevRound.lockPrice) / 1_000_0}
                      </Text>
                    </Text>
                  </Grid>
                </Grid.Container>
              </Card.Header>
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
                      Starts at:{" "}
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
                      Total staked:{" "}
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
                        {toNear(
                          userBids && userBids[state.currentEpoch]
                            ? userBids[state.currentEpoch].amount
                            : 0
                        )}
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
            <form onSubmit={() => null}>
              <Card.Header>
                <Text h2 css={{ lineHeight: "$xs" }}>
                  My bets
                </Text>
              </Card.Header>
              <Card.Body css={{ py: "$2" }}>
                {sortedBidKeys.map((key) => (
                  <React.Fragment key={key}>
                    <Grid xs={12}>
                      <Text css={{ color: "$accents8" }}>Round #{key}</Text>
                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 24,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        {userBids![key].position === "2" ? "🐂" : "🐻"}
                      </Text>

                      <Text
                        weight="semibold"
                        css={{
                          marginLeft: 0,
                          marginRight: 8,
                          color:
                            Number(key) >= state.currentEpoch - 1
                              ? "$yellow700"
                              : userBids![key].hasWon
                              ? "$green700"
                              : "$red800",
                          display: "inline-block",
                        }}
                      >
                        {toNear(userBids![key].amount)} NEAR
                      </Text>

                      {userBids![key].claimed ? (
                        <Checkbox
                          isDisabled={true}
                          defaultSelected={true}
                          size="xs"
                        >
                          Claimed
                        </Checkbox>
                      ) : Number(key) < Number(state.currentEpoch - 1) ? (
                        userBids![key].hasWon && (
                          <Button
                            size="xs"
                            rounded
                            bordered
                            color="gradient"
                            css={{ marginLeft: 4 }}
                            onClick={() => handleClaimSubmit(key)}
                          >
                            Claim
                          </Button>
                        )
                      ) : (
                        "Pending"
                      )}
                    </Grid>
                  </React.Fragment>
                ))}
              </Card.Body>
              <Card.Footer css={{ marginTop: 16 }}></Card.Footer>
            </form>
          </Card>
        </Grid>
      </Grid.Container>
    </>
  );
};

export default Panel;

export const toNear = (amount: BigNumber.Value) =>
  new BigNumber(amount)
    .div("1000000000000000000000000")
    .toFixed(4, BigNumber.ROUND_UP)
    .toString();

const toDate = (timestamp: BigNumber.Value) =>
  new BigNumber(timestamp).idiv(1_000_000).toNumber();
