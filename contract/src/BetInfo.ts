export enum Position {
  None = 0,
  Bearish = 1,
  Bullish = 2,
}

export class BetInfo {
  position: Position;
  amount: string;
  claimed: boolean;

  constructor(position: Position, amount: string, claimed: boolean) {
    this.position = position;
    this.amount = amount;
    this.claimed = claimed;
  }
}
