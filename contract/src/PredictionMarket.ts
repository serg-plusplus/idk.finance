import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  assert,
  LookupMap,
  UnorderedSet,
} from "near-sdk-js";

@NearBindgen({})
class PredictionMarket {
  genesisStartOnce: boolean;

  owner: string = "admin.idk.near";
  pendingOwner: string = "";
  manager: string = "manager.idk.near";

  oracle: string = "oracleprice.near";
  assetId: string = "wrap.near";

  minBid: bigint = BigInt(1000);
  duration: bigint = BigInt(1800);

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
    const userRounds = this._getUserRounds(sender);
    let betInfo = this._getBetInfo(epoch, sender);
    betInfo.position = Position.Bearish;
    betInfo.amount = amount;
    userRounds.set(epoch);

    this._setBetInfo(epoch, sender, betInfo);
    this._setUserRounds(sender, userRounds);

    near.log(`${sender} is bearish in the ${epoch} epoch. Bid is ${amount}`);
  }

  @call({ payableFunction: true })
  betBull({ epoch }: { epoch: number }): void {
    assert(epoch == this.currentEpoch, "Wrong epoch");
    // check bettable round
    assert((near.attachedDeposit() as bigint) >= this.minBid, "Bid is too low");
    // check bid only once per round

    const amount: bigint = near.attachedDeposit();
    let round = this._getRound(epoch);
    round.totalAmount += amount;
    round.bullAmount += amount;

    const sender = near.predecessorAccountId();
    const userRounds = this._getUserRounds(sender);
    let betInfo = this._getBetInfo(epoch, sender);
    betInfo.position = Position.Bullish;
    betInfo.amount = amount;
    userRounds.set(epoch);

    this._setBetInfo(epoch, sender, betInfo);
    this._setUserRounds(sender, userRounds);

    near.log(`${sender} is bullish in the ${epoch} epoch. Bid is ${amount}`);
  }

  // ORACLE

  @call({})
  reveal({}: {}): void {
    // get price
    // lock n - 1 round
    // end n - 2 round
    // distribute rewards
    this.currentEpoch += 1;
    this._safeStartRound(this.currentEpoch);
  }

  // ADMIN

  @call({})
  setMinBid({ minBid }: { minBid: bigint }): void {
    this._assertOwner();
    this.minBid = minBid;
  }

  @call({})
  setDuration({ duration }: { duration: bigint }): void {
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

  _safeStartRound(epoch: number): void {
    let oldRound = this._getRound(epoch - 2);

    assert(this.genesisStartOnce, "Init game first");
    assert(oldRound.closeTimestamp != BigInt(0), "Round n-2 is not ended");
    assert(
      oldRound.closeTimestamp < near.blockTimestamp(),
      "Round n-2 is too young"
    );

    this._startRound(epoch);
  }

  _startRound(epoch: number): void {
    let round = new Round(
      epoch,
      near.blockTimestamp(),
      near.blockTimestamp() + this.duration,
      near.blockTimestamp() + BigInt(2) * this.duration,
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      false
    );
    this._setRound(epoch, round);
    near.log(`The roumd ${epoch} started`);
  }

  // HELPERS
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

  _getUserRounds(owner: string): UnorderedSet {
    let userRounds = this.userRounds.get(owner);
    if (userRounds === null) {
      return new UnorderedSet(owner);
    }
    return userRounds as UnorderedSet;
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

  _setRound(epoch: number, roumd: Round): void {
    this.rounds.set(String.fromCharCode(epoch), roumd);
  }

  _setUserRounds(owner: string, userRounds: UnorderedSet): void {
    this.userRounds.set(owner, userRounds);
  }

  // claim
  // reveal
  // setOracle
}
