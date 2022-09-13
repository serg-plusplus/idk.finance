import constate from "constate";

import type { Wallet } from "./near-wallet";
import type { Contract } from "./near-interface";
import { useCallback } from "react";

export type IdkStateProviderProps = {
  isSignedIn: boolean;
  wallet: Wallet;
  contract: Contract;
};

export enum Position {
  None,
  Bearish,
  Bullish,
}

export const [IdkStateProvider, useIdkState] = constate(
  ({ isSignedIn, contract, wallet }: IdkStateProviderProps) => {
    const getState = useCallback(async () => {
      return await wallet.viewMethod({ method: "getState" });
    }, [wallet]);

    const getRound = useCallback(
      async (epoch: number) => {
        return await wallet.viewMethod({ method: "getRound", args: { epoch } });
      },
      [wallet]
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

    const genesisStartRound = useCallback(async () => {}, [wallet]);

    return {
      isSignedIn,
      contract,
      wallet,

      getState,
      getRound,

      bet,
    };
  }
);
