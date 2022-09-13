// import {
//   NearBindgen,
//   call,
//   view,
//   initialize,
//   near,
//   LookupMap,
// } from "near-sdk-js";
enum Position {
  None,
  Bearish,
  Bullish,
}

class BetInfo {
  position: Position;
  amount: bigint;
  claimed: boolean;

  constructor(position: Position, amount: bigint, claimed: boolean) {
    this.position = position;
    this.amount = amount;
    this.claimed = claimed;
  }
}
