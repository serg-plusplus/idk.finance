import constate from "constate";

import type { Wallet } from "./near-wallet";
import type { Contract } from "./near-interface";
import { useCallback } from "react";

export type IdkStateProviderProps = {
  isSignedIn: boolean;
  wallet: Wallet;
  contract: Contract;
};

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

    return {
      isSignedIn,
      contract,
      wallet,

      getState,
      getRound,
    };
  }
);
