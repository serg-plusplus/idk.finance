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
import { BetInfo, Position } from "./BetInfo";
import { Round } from "./Round";

@NearBindgen({})
class PredictionMarket {
  genesisLockOnce: boolean;
  genesisStartOnce: boolean;

  owner: string = "admin.idk.near";
  pendingOwner: string = "";
  manager: string = "manager.idk.near";

  oracle: string = "oracleprice.near";
  assetId: string = "wrap.near";

  minBid: bigint = BigInt(1000);
  duration: bigint = BigInt(1800);

  feeRate: bigint = BigInt(10);
  feePrecision: bigint = BigInt(1000);
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

  // VIEW

  @view({})
  getState() {
    return {
      genesisLockOnce: this.genesisLockOnce,
      genesisStartOnce: this.genesisStartOnce,
      owner: this.owner,
      pendingOwner: this.pendingOwner,
      manager: this.manager,
      oracle: this.oracle,
      assetId: this.assetId,
      minBid: this.minBid.toString(),
      duration: this.duration.toString(),
      feeRate: this.feeRate.toString(),
      feePrecision: this.feePrecision.toString(),
      feeTreasury: this.feeTreasury.toString(),
      currentEpoch: this.currentEpoch,
    };
  }

  @view({})
  getRound({ epoch }: { epoch: number }) {
    return this.rounds.get(epoch.toString());
  }

  // PUBLIC

  @call({ payableFunction: true })
  bet({ epoch, position }: { epoch: number; position: Position }): void {
    assert(epoch == this.currentEpoch, "Wrong epoch");
    // check bettable round
    assert((near.attachedDeposit() as bigint) >= this.minBid, "Bid is too low");
    // check bid only once per round

    const amount: bigint = near.attachedDeposit();
    let round = this._getRound(epoch);
    round.totalAmount += amount;
    if (position == Position.Bearish) {
      round.bearAmount += amount;
    } else {
      round.bullAmount += amount;
    }

    const sender = near.predecessorAccountId();
    const userRounds = this._getUserRounds(sender);
    let betInfo = this._getBetInfo(epoch, sender);
    betInfo.position = position;
    betInfo.amount = amount;
    userRounds.set(epoch);

    this._setBetInfo(epoch, sender, betInfo);
    this._setUserRounds(sender, userRounds);

    near.log(`${sender} bids in the ${epoch} epoch. Amount is ${amount}`);
  }

  @call({})
  claim({ epochs }: { epochs: number[] }): void {
    let reward = BigInt(0);
    const sender = near.predecessorAccountId();

    for (let epoch of epochs) {
      let round = this._getRound(epoch);

      assert(round.startTimestamp != BigInt(0), "Round isn't started");
      assert(round.closeTimestamp < near.blockTimestamp(), "Round isn't ended");
      assert(round.oracleCalled, "Oracle isn't called");
      assert(this.claimable(epoch, sender), "Not eligible");

      let betInfo = this._getBetInfo(epoch, sender);
      const epochReward =
        (betInfo.amount * round.rewardAmount) / round.rewardBaseCalAmount;

      reward += epochReward;
      betInfo.claimed = true;

      this._setBetInfo(epoch, sender, betInfo);

      near.log(`${sender} claimed ${epochReward} for ${epoch} round.`);
    }

    if (reward > 0) {
      this._safeTransfer(sender, reward);
    }
  }

  @call({})
  reveal({}: {}): void {
    assert(
      this.genesisLockOnce && this.genesisStartOnce,
      "Genesis rounds aren't finished"
    );

    let price = this._getPrice();
    this._safeLockRound(this.currentEpoch, price);
    this._safeEndRound(this.currentEpoch - 1, price);
    this._calculateRewards(this.currentEpoch - 1);

    this.currentEpoch += 1;
    this._safeStartRound(this.currentEpoch);
  }

  @call({})
  genesisStartRound({}: {}): void {
    assert(!this.genesisStartOnce, "Genesis round is started");

    this.currentEpoch += 1;
    this._startRound(this.currentEpoch);
    this.genesisStartOnce = true;
  }

  @call({})
  genesisLockRound({}: {}): void {
    assert(this.genesisStartOnce, "Genesis round is not started");
    assert(!this.genesisLockOnce, "Genesis round is locked");

    let price = this._getPrice();
    this._safeLockRound(this.currentEpoch, price);

    this.currentEpoch += 1;
    this._startRound(this.currentEpoch);
    this.genesisLockOnce = true;
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
  setFeeRate({ feeRate }: { feeRate: bigint }): void {
    this._assertOwner();
    this.feeRate = feeRate;
  }

  @call({})
  claimFee({ receiver }: { receiver: string }): void {
    this._assertOwner();
    this._safeTransfer(receiver, this.feeTreasury);
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

  _calculateRewards(epoch: number): void {
    let round = this._getRound(epoch);

    assert(
      round.rewardBaseCalAmount == BigInt(0) && round.rewardAmount == BigInt(0),
      "Reward calculated"
    );

    let treasuryAmt;
    if (round.closePrice > round.lockPrice) {
      round.rewardBaseCalAmount = round.bullAmount;
      treasuryAmt = (round.totalAmount * this.feeRate) / this.feePrecision;
      round.rewardAmount = round.totalAmount - treasuryAmt;
    } else if (round.closePrice < round.lockPrice) {
      round.rewardBaseCalAmount = round.bearAmount;
      treasuryAmt = (round.totalAmount * this.feeRate) / this.feePrecision;
      round.rewardAmount = round.totalAmount - treasuryAmt;
    } else {
      round.rewardBaseCalAmount = BigInt(0);
      round.rewardAmount = BigInt(0);
      treasuryAmt = round.totalAmount;
    }

    this.feeTreasury += treasuryAmt;
    this._setRound(epoch, round);

    near.log(`Rewards for ${epoch} round calculated`);
  }

  _safeLockRound(epoch: number, price: bigint): void {
    let round = this._getRound(epoch);

    assert(round.startTimestamp != BigInt(0), "Round n-1 is not started");
    assert(round.lockTimestamp < near.blockTimestamp(), "Lock is too early");

    round.closeTimestamp = near.blockTimestamp() + this.duration;
    round.lockPrice = price;

    this._setRound(epoch, round);

    near.log(`The round ${epoch} locked`);
  }

  _safeEndRound(epoch: number, price: bigint): void {
    let round = this._getRound(epoch);

    assert(round.lockTimestamp != BigInt(0), "Round n-1 is not started");
    assert(round.closeTimestamp < near.blockTimestamp(), "End is too early");

    round.closePrice = price;
    round.oracleCalled = true;

    this._setRound(epoch, round);

    near.log(`The round ${epoch} closed`);
  }

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
    let betInfo: any = this.rounds.get(epoch.toString() + owner);
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
    let round: any = this.rounds.get(epoch.toString());
    assert(round != null, "Round doesn't exist");
    return new Round(
      round.epoch,
      round.startTimestamp,
      round.lockTimestamp,
      round.closeTimestamp,
      round.lockPrice,
      round.closePrice,
      round.totalAmount,
      round.bullAmount,
      round.bearAmount,
      round.rewardBaseCalAmount,
      round.rewardAmount,
      round.oracleCalled
    );
  }

  _getPrice(): bigint {
    // TODO
    return BigInt(4.22);
  }

  _setBetInfo(epoch: number, owner: string, betInfo: BetInfo): void {
    this.rounds.set(epoch.toString() + owner, betInfo);
  }

  _setRound(epoch: number, roumd: Round): void {
    this.rounds.set(epoch.toString(), roumd);
  }

  _setUserRounds(owner: string, userRounds: UnorderedSet): void {
    this.userRounds.set(owner, userRounds);
  }

  _safeTransfer(receiver: string, amount: bigint): void {
    const promise = near.promiseBatchCreate(receiver);
    near.promiseBatchActionTransfer(promise, amount);
  }

  @view({})
  claimable(epoch: number, owner: string): boolean {
    let round = this._getRound(epoch);
    let betInfo = this._getBetInfo(epoch, owner);

    if (round.lockPrice == round.closePrice) {
      return false;
    }
    return (
      round.oracleCalled &&
      betInfo.amount != BigInt(0) &&
      !betInfo.claimed &&
      ((round.closePrice > round.lockPrice &&
        betInfo.position == Position.Bullish) ||
        (round.closePrice < round.lockPrice &&
          betInfo.position == Position.Bearish))
    );
  }
}
