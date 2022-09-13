import constate from "constate";

import type { Wallet } from "./near-wallet";
import { useCallback, useEffect, useState } from "react";

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
};

export const [IdkStateProvider, useIdkState] = constate(
  ({ isSignedIn, wallet }: IdkStateProviderProps) => {
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

    const bet = useCallback(
      async ({ epoch, position }: { epoch: number; position: Position }) => {
        return await wallet.callMethod({
          method: "bet",
          args: { epoch, position },
        });
      },
      [wallet]
    );

    const claim = useCallback(
      async ({ epochs }: { epochs: number[] }) => {
        return await wallet.callMethod({
          method: "bet",
          args: { epochs },
        });
      },
      [wallet]
    );

    const [snapshot, setSnapshot] = useState<Snapshot>();

    useEffect(() => {
      const syncAndDefer = async () => {
        const state = await getState();

        const latestRounds = await Promise.all(
          Array.from({ length: Math.min(state.currentEpoch, 16) }).map((_, i) =>
            i > 1
              ? getRound(state.currentEpoch - i)
              : getRoundMemo(state.currentEpoch - i)
          )
        );

        setSnapshot({ state, latestRounds });

        setTimeout(syncAndDefer, 3_000);
      };

      syncAndDefer();
    }, [setSnapshot, getState, getRound]);

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
