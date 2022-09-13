export class Round {
  epoch: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  closeTimestamp: bigint;
  lockPrice: bigint;
  closePrice: bigint;
  totalAmount: bigint;
  bullAmount: bigint;
  bearAmount: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  oracleCalled: boolean;

  constructor(
    epoch,
    startTimestamp,
    lockTimestamp,
    closeTimestamp,
    lockPrice,
    closePrice,
    totalAmount,
    bullAmount,
    bearAmount,
    rewardBaseCalAmount,
    rewardAmount,
    oracleCalled
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
