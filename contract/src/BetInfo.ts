export enum Position {
  None,
  Bearish,
  Bullish,
}

export class BetInfo {
  position: Position;
  amount: bigint;
  claimed: boolean;

  constructor(position: Position, amount: bigint, claimed: boolean) {
    this.position = position;
    this.amount = amount;
    this.claimed = claimed;
  }
}
