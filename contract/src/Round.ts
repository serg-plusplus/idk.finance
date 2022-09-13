export class Round {
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

  constructor(
    epoch: string,
    startTimestamp: string,
    lockTimestamp: string,
    closeTimestamp: string,
    lockPrice: string,
    closePrice: string,
    totalAmount: string,
    bullAmount: string,
    bearAmount: string,
    rewardBaseCalAmount: string,
    rewardAmount: string,
    oracleCalled: boolean
  ) {
    this.epoch = epoch;
    this.startTimestamp = startTimestamp;
    this.lockTimestamp = lockTimestamp;
    this.closeTimestamp = closeTimestamp;
    this.lockPrice = lockPrice;
    this.closePrice = closePrice;
    this.totalAmount = totalAmount;
    this.bullAmount = bullAmount;
    this.bearAmount = bearAmount;
    this.rewardBaseCalAmount = rewardBaseCalAmount;
    this.rewardAmount = rewardAmount;
    this.oracleCalled = oracleCalled;
  }
}
