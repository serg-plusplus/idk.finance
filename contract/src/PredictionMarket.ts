import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  assert,
  LookupMap,
} from "near-sdk-js";

@NearBindgen({})
class PredictionMarket {
  owner: string = "admin.idk.near";
  pendingOwner: string = "";
  manager: string = "manager.idk.near";

  minBid: bigint = BigInt(1000);
  duration: number = 1800;

  feeRate: number = 10;
  feePrecision: number = 1000;
  feeTreasury: bigint = BigInt(0);

  currentEpoch: number = 0;

  bids: LookupMap = new LookupMap("b");
  rounds: LookupMap = new LookupMap("r");
  userRounds: LookupMap = new LookupMap("u");

  @initialize({})
  init({ owner, manager }: { owner: string; manager: string }) {
    this.owner = owner;
    this.manager = manager;
  }

  // PUBLIC

  @call({ payableFunction: true })
  betBear({ epoch }: { epoch: number }): void {
    assert(epoch == this.currentEpoch, "Wrong epoch");
    // check bettable round
    assert((near.attachedDeposit() as bigint) >= this.minBid, "Bid is too low");
    // check bid only once per round

    const amount: bigint = near.attachedDeposit();
    let round = this._getRound(epoch);
    round.totalAmount += amount;
    round.bearAmount += amount;

    const sender = near.predecessorAccountId();
    let betInfo = this._getBetInfo(epoch, sender);
    betInfo.position = Position.Bearish;
    betInfo.amount = amount;
    this._setBetInfo(epoch, sender, betInfo);
    // add epoch to userRounds

    near.log(`${sender} is bearish in the ${epoch} epoch. Bid is ${amount}`);
  }

  // ORACLE

  @call({})
  reveal({ minBid }: { minBid: bigint }): void {}

  // ADMIN

  @call({})
  setMinBid({ minBid }: { minBid: bigint }): void {
    this._assertOwner();
    this.minBid = minBid;
  }

  @call({})
  setDuration({ duration }: { duration: number }): void {
    this._assertOwner();
    this.duration = duration;
  }

  @call({})
  setFeeRate({ feeRate }: { feeRate: number }): void {
    this._assertOwner();
    this.feeRate = feeRate;
  }

  @call({})
  claimFee({ receiver }: { receiver: string }): void {
    this._assertOwner();
    const promise = near.promiseBatchCreate(receiver);
    near.promiseBatchActionTransfer(promise, this.feeTreasury);
    this.feeTreasury = BigInt(0);
  }

  @call({})
  transferOwnership({ pendingOwner }: { pendingOwner: string }): void {
    this._assertOwner();
    this.pendingOwner = pendingOwner;
  }

  @call({})
  confirmTransferOwnership({}: {}): void {
    this._assertPendingOwner();
    this.owner = this.pendingOwner;
    this.pendingOwner = "";
  }

  // INTERNAL
  _assertOwner(): void {
    assert(near.predecessorAccountId() == this.owner, "Not an owner");
  }

  _assertPendingOwner(): void {
    assert(near.predecessorAccountId() == this.pendingOwner, "Not an owner");
  }

  _getBetInfo(epoch: number, owner: string): BetInfo {
    let betInfo = this.rounds.get(String.fromCharCode(epoch) + owner);
    if (betInfo === null) {
      return new BetInfo(Position.None, BigInt(0), false);
    }
    return new BetInfo(betInfo.position, betInfo.amount, betInfo.claimed);
  }

  _getRound(epoch: number): Round {
    let round = this.rounds.get(String.fromCharCode(epoch));
    if (round === null) {
      return new Round(0, {}, {});
    }
    return new Round(round.balance, betInfo.allowances, betInfo.lockedBalances);
  }

  _setBetInfo(epoch: number, owner: string, betInfo: BetInfo): void {
    this.rounds.set(String.fromCharCode(epoch) + owner, betInfo);
  }

  // bet
  // claim
  // reveal
  // setOracle
  // setFee
}
