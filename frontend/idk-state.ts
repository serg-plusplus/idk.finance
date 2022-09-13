import constate from "constate";

import type { Wallet } from "./near-wallet";
import type { Contract } from "./near-interface";

export type IdkStateProviderProps = {
  isSignedIn: boolean;
  wallet: Wallet;
  contract: Contract;
};

export const [IdkStateProvider, useIdkState] = constate(
  ({ isSignedIn, contract, wallet }: IdkStateProviderProps) => {
    return {
      isSignedIn,
      contract,
      wallet,
    };
  }
);
