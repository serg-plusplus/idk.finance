import { useCallback, useEffect, useState } from "react";
import constate from "constate";
import BigNumber from "bignumber.js";

import type { Wallet } from "./near-wallet";
import { ChartData, getChartData } from "./chart/chart-data";

BigNumber.set({ EXPONENTIAL_AT: 36 });

export type IdkStateProviderProps = {
  isSignedIn: boolean;
  wallet: Wallet;
};

export type IdkState = {
  genesisLockOnce: boolean;
  genesisStartOnce: boolean;
  owner: string;
  pendingOwner: string;
  manager: string;
  oracle: string;
  assetId: string;
  minBid: string;
  duration: string;
  feeRate: string;
  feePrecision: string;
  feeTreasury: string;
  currentEpoch: number;
};

export type IdkRound = {
  epoch: string;
  startTimestamp: string;
  lockTimestamp: string;
  closeTimestamp: string;
  lockPrice: string;
  closePrice: string;
  totalAmount: string;
  bullAmount: string;
  bearAmount: string;
  rewardBaseCalAmount: string;
  rewardAmount: string;
  oracleCalled: boolean;
};

export enum Position {
  None,
  Bearish,
  Bullish,
}

export type Snapshot = {
  state: IdkState;
  latestRounds: IdkRound[];
  chartData: ChartData;
  userRounds: number[];
  userBids: Record<number, any>;
};

export const [IdkStateProvider, useIdkState] = constate(
  ({ isSignedIn, wallet }: IdkStateProviderProps) => {
    // VIEW

    const getState = useCallback(async (): Promise<IdkState> => {
      return await wallet.viewMethod({ method: "getState" });
    }, [wallet]);

    const getRound = useCallback(
      async (epoch: number): Promise<IdkRound> => {
        return await wallet.viewMethod({ method: "getRound", args: { epoch } });
      },
      [wallet]
    );

    const getRoundMemo = useCallback(
      async (epoch: number): Promise<IdkRound> => {
        const sKey = `_round_${epoch}`;

        const stored = localStorage.getItem(sKey);
        if (stored) return JSON.parse(stored);

        const round = await getRound(epoch);
        localStorage.setItem(sKey, JSON.stringify(round));

        return round;
      },
      [getRound]
    );

    const getUserRounds = useCallback(async (): Promise<number[]> => {
      return await wallet.viewMethod({
        method: "getUserRounds",
        args: { account: wallet.accountId },
      });
    }, [wallet]);

    const getBid = useCallback(
      async (epoch: number): Promise<any> => {
        return await wallet.viewMethod({
          method: "getBid",
          args: { epoch, account: wallet.accountId },
        });
      },
      [wallet]
    );

    // SNAPSHOT

    const [snapshot, setSnapshot] = useState<Snapshot>();

    useEffect(() => {
      const syncAndDefer = async () => {
        const [{ state, latestRounds }, chartData, userRounds] =
          await Promise.all([
            (async () => {
              const state = await getState();

              const latestRounds = await Promise.all(
                Array.from({ length: Math.min(state.currentEpoch, 16) }).map(
                  (_, i) =>
                    i > 1
                      ? getRound(state.currentEpoch - i)
                      : getRound(state.currentEpoch - i)
                )
              );

              return { state, latestRounds };
            })(),
            getChartData(),
            getUserRounds(),
          ]);

        const userBids = userRounds
          ? Object.fromEntries(
              await Promise.all(
                userRounds.map(async (epoch) => [epoch, await getBid(epoch)])
              )
            )
          : {};

        setSnapshot({ state, latestRounds, chartData, userRounds, userBids });
        console.info({ state, latestRounds, chartData, userRounds, userBids });

        setTimeout(syncAndDefer, 5_000);
      };

      syncAndDefer();
    }, [setSnapshot, getState, getRound]);

    // METHODS

    const bet = useCallback(
      async (position: Position, amount: string) => {
        if (!snapshot) return;

        if (new BigNumber(amount).isLessThanOrEqualTo(0)) {
          throw new Error("Must be positive");
        }

        return await wallet.callMethod({
          method: "bet",
          args: { epoch: snapshot.state.currentEpoch, position },
          deposit: new BigNumber(amount)
            .times("1000000000000000000000000")
            .integerValue()
            .toString(),
        });
      },
      [wallet, snapshot]
    );

    const claim = useCallback(
      async (epochs: number[]) => {
        return await wallet.callMethod({
          method: "bet",
          args: { epochs },
        });
      },
      [wallet]
    );

    return {
      isSignedIn,
      wallet,

      getState,
      getRound,

      bet,
      claim,

      ...snapshot,
    };
  }
);
