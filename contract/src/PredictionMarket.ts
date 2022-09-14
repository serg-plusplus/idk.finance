import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  assert,
  LookupMap,
  UnorderedSet,
  NearPromise,
} from "near-sdk-js";
import { BetInfo, Position } from "./BetInfo";
import { Round } from "./Round";
import { PricesResponse } from "./Oracle";

@NearBindgen({})
class PredictionMarket {
  genesisLockOnce: boolean;
  genesisStartOnce: boolean;

  owner: string = "admin.idk.near";
  pendingOwner: string = "";

  oracle: string = "oracleprice.near";
  oracleParams: string = JSON.stringify({ asset_ids: ["wrap.near"] });
  oracleGas: string = "50000000000000";
  timeDelay: string = "1800";
  assetId: string = "wrap.near";

  minBid: string = "1000";
  duration: string = "1800";

  feeRate: string = "10";
  feePrecision: string = "1000";
  feeTreasury: string = "0";

  currentEpoch: number = 0;

  bids: LookupMap = new LookupMap("b");
  rounds: LookupMap = new LookupMap("r");
  userRounds: LookupMap = new LookupMap("u");

  @initialize({})
  init({ owner, manager }: { owner: string; manager: string }) {
    this.owner = owner;
  }

  // VIEW

  @view({})
  getState() {
    return {
      genesisLockOnce: this.genesisLockOnce,
      genesisStartOnce: this.genesisStartOnce,
      owner: this.owner,
      pendingOwner: this.pendingOwner,
      oracle: this.oracle,
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

  /**
   * @notice Make the bet on the price move
   * @param epoch: epoch on each the user want to participate; must be current epoch
   * @param position: bullish or bearish
   */
  @call({ payableFunction: true })
  bet({ epoch, position }: { epoch: number; position: Position }): void {
    const sender = near.predecessorAccountId();
    const userRounds = this._getUserRounds(sender);

    assert(epoch == this.currentEpoch, "Wrong epoch");
    assert(
      (near.attachedDeposit() as bigint) >= BigInt(this.minBid),
      "Bid is too low"
    );
    assert(position != Position.None, "Position should be selected");
    assert(
      !userRounds.contains(epoch),
      "User already participated in this round"
    );

    const amount: bigint = near.attachedDeposit();
    let round = this._getRound(epoch);
    round.totalAmount = (BigInt(round.totalAmount) + amount).toString();
    if (position == Position.Bearish) {
      round.bearAmount = (BigInt(round.bearAmount) + amount).toString();
    } else {
      round.bullAmount = (BigInt(round.bullAmount) + amount).toString();
    }

    let betInfo = this._getBetInfo(epoch, sender);
    betInfo.position = position;
    betInfo.amount = amount.toString();
    userRounds.set(epoch);

    this._setBetInfo(epoch, sender, betInfo);
    this._setUserRounds(sender, userRounds);

    near.log(`${sender} bids in the ${epoch} epoch. Amount is ${amount}`);
  }

  /**
   * @notice Claim rewards for the successful bids
   * @param epochs: epochs in which the user has unclaimed rewards
   */
  @call({})
  claim({ epochs }: { epochs: number[] }): void {
    let reward = BigInt(0);
    const sender = near.predecessorAccountId();

    for (let epoch of epochs) {
      let round = this._getRound(epoch);

      assert(BigInt(round.startTimestamp) != BigInt(0), "Round isn't started");
      assert(
        BigInt(round.closeTimestamp) < near.blockTimestamp(),
        "Round isn't ended"
      );
      assert(round.oracleCalled, "Oracle isn't called");
      assert(this.claimable(epoch, sender), "Claim is not eligible");

      let betInfo = this._getBetInfo(epoch, sender);
      const epochReward =
        (BigInt(betInfo.amount) * BigInt(round.rewardAmount)) /
        BigInt(round.rewardBaseCalAmount);
      reward += epochReward;
      betInfo.claimed = true;

      this._setBetInfo(epoch, sender, betInfo);

      near.log(`${sender} claimed ${epochReward} for ${epoch} round.`);
    }

    if (reward > 0) {
      this._safeTransfer(sender, reward);
    }
  }

  /**
   * @notice Request price and rounds updates
   */
  @call({})
  reveal({}: {}): void {
    assert(
      this.genesisLockOnce && this.genesisStartOnce,
      "Genesis rounds aren't finished"
    );

    this._requestPrice(this.currentEpoch, "_revealCallback");
  }

  /**
   * @notice Start new round, lock previous and end the one before
   * @param epoch: epoch on each the price is updated; must be current epoch
   */
  @call({ privateFunction: true })
  _revealCallback({ epoch }: { epoch: number }): void {
    assert(epoch == this.currentEpoch, "Epoch is wrong");

    let price = this._getPrice();
    this._safeLockRound(this.currentEpoch, price);
    this._safeEndRound(this.currentEpoch - 1, price);
    this._calculateRewards(this.currentEpoch - 1);

    this.currentEpoch += 1;
    this._safeStartRound(this.currentEpoch);
  }

  /**
   * @notice Start the first round
   */
  @call({})
  genesisStartRound({}: {}): void {
    assert(!this.genesisStartOnce, "Genesis round is started");

    this.currentEpoch += 1;
    this._startRound(this.currentEpoch);
    this.genesisStartOnce = true;
  }

  /**
   * @notice Request price and management of first 2 rounds
   */
  @call({})
  genesisLockRound({}: {}): void {
    assert(this.genesisStartOnce, "Genesis round is not started");
    assert(!this.genesisLockOnce, "Genesis round is locked");

    this._requestPrice(this.currentEpoch, "_genesisLockRoundCallback");
  }

  /**
   * @notice Start second round and lock first round
   * @param epoch: epoch on each the price is updated; must be current epoch
   */
  @call({ privateFunction: true })
  _genesisLockRoundCallback({ epoch }: { epoch: number }): void {
    assert(epoch == this.currentEpoch, "Epoch is wrong");

    let price = this._getPrice();
    this._safeLockRound(this.currentEpoch, price);

    this.currentEpoch += 1;
    this._startRound(this.currentEpoch);
    this.genesisLockOnce = true;
  }

  // ADMIN

  @call({})
  setMinBid({ minBid }: { minBid: string }): void {
    this._assertOwner();
    BigInt(this.minBid);
    this.minBid = minBid;
  }

  @call({})
  setDuration({ duration }: { duration: string }): void {
    this._assertOwner();
    BigInt(this.duration);
    this.duration = duration;
  }

  @call({})
  setFeeRate({ feeRate }: { feeRate: string }): void {
    this._assertOwner();
    BigInt(this.feeRate);
    this.feeRate = feeRate;
  }

  @call({})
  claimFee({ receiver }: { receiver: string }): void {
    this._assertOwner();
    this._safeTransfer(receiver, BigInt(this.feeTreasury));
    this.feeTreasury = "0";
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

  /**
   * @notice Calculate round results and rewards
   * @param epoch: epoch on which the rewards are calculated
   */
  _calculateRewards(epoch: number): void {
    let round = this._getRound(epoch);

    assert(
      BigInt(round.rewardBaseCalAmount) == BigInt(0) &&
        BigInt(round.rewardAmount) == BigInt(0),
      "Reward calculated"
    );

    let treasuryAmt;
    if (round.closePrice > round.lockPrice) {
      round.rewardBaseCalAmount = round.bullAmount;
      treasuryAmt =
        (BigInt(round.totalAmount) * BigInt(this.feeRate)) /
        BigInt(this.feePrecision);
      round.rewardAmount = (BigInt(round.totalAmount) - treasuryAmt).toString();
    } else if (round.closePrice < round.lockPrice) {
      round.rewardBaseCalAmount = round.bearAmount;
      treasuryAmt =
        (BigInt(round.totalAmount) * BigInt(this.feeRate)) /
        BigInt(this.feePrecision);
      round.rewardAmount = (BigInt(round.totalAmount) - treasuryAmt).toString();
    } else {
      round.rewardBaseCalAmount = "0";
      round.rewardAmount = "0";
      treasuryAmt = BigInt(round.totalAmount);
    }

    this.feeTreasury = (BigInt(this.feeTreasury) + treasuryAmt).toString();
    this._setRound(epoch, round);

    near.log(`Rewards for ${epoch} round calculated`);
  }

  /**
   * @notice Lock round i.e. stop accepting the bids for the round
   * @param epoch: what epoch is to be locked
   * @param price: asset's price at the epoch lock
   */
  _safeLockRound(epoch: number, price: bigint): void {
    let round = this._getRound(epoch);

    assert(
      BigInt(round.startTimestamp) != BigInt(0),
      "Round n-1 is not started"
    );
    assert(
      BigInt(round.lockTimestamp) < near.blockTimestamp(),
      "Lock is too early"
    );

    round.closeTimestamp = (
      near.blockTimestamp() + BigInt(this.duration)
    ).toString();
    round.lockPrice = price.toString();

    this._setRound(epoch, round);

    near.log(`The round ${epoch} locked`);
  }

  /**
   * @notice End round and make available for rewards distribution
   * @param epoch: what epoch is to be locked
   * @param price: asset's price at which the epoch is closed
   */
  _safeEndRound(epoch: number, price: bigint): void {
    let round = this._getRound(epoch);

    assert(
      BigInt(round.lockTimestamp) != BigInt(0),
      "Round n-1 is not started"
    );
    assert(
      BigInt(round.closeTimestamp) < near.blockTimestamp(),
      "End is too early"
    );

    round.closePrice = price.toString();
    round.oracleCalled = true;

    this._setRound(epoch, round);

    near.log(`The round ${epoch} closed`);
  }

  /**
   * @notice Check all constraints and start new round
   * @param epoch: new epoch
   */
  _safeStartRound(epoch: number): void {
    let oldRound = this._getRound(epoch - 2);

    assert(this.genesisStartOnce, "Init game first");
    assert(
      BigInt(oldRound.closeTimestamp) != BigInt(0),
      "Round n-2 is not ended"
    );
    assert(
      BigInt(oldRound.closeTimestamp) < near.blockTimestamp(),
      "Round n-2 is too young"
    );

    this._startRound(epoch);
  }

  /**
   * @notice Start new round
   * @param epoch: new epoch
   */
  _startRound(epoch: number): void {
    let round = new Round(
      epoch.toFixed(),
      near.blockTimestamp().toString(),
      (near.blockTimestamp() + BigInt(this.duration)).toString(),
      (near.blockTimestamp() + BigInt(2) * BigInt(this.duration)).toString(),
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      false
    );
    this._setRound(epoch, round);
    near.log(`The round ${epoch} started`);
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
      return new BetInfo(Position.None, "0", false);
    }
    return new BetInfo(betInfo.position, betInfo.amount, betInfo.claimed);
  }

  _getUserRounds(owner: string): UnorderedSet {
    let userRounds: any = this.userRounds.get(owner);
    let rounds = new UnorderedSet(owner);
    if (userRounds !== null) {
      rounds.extend(userRounds);
    }
    return rounds;
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
    const pricesInfo = JSON.parse(near.promiseResult(0)) as PricesResponse;
    let nearInfo = pricesInfo.prices[0];

    assert(nearInfo.asset_id == this.assetId, "Asset id is wrong");

    return BigInt(nearInfo.price.multiplier);
  }

  _requestPrice(epoch: number, callback: string): NearPromise {
    const promise = NearPromise.new(this.oracle)
      .functionCall(
        "get_price_data",
        this.oracleParams,
        BigInt(0),
        BigInt(this.oracleGas)
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          callback,
          JSON.stringify({ epoch }),
          BigInt(0),
          BigInt(this.oracleGas)
        )
      );

    return promise;
  }

  _setBetInfo(epoch: number, owner: string, betInfo: BetInfo): void {
    this.rounds.set(epoch.toString() + owner, betInfo);
  }

  _setRound(epoch: number, round: Round): void {
    this.rounds.set(epoch.toString(), round);
  }

  _setUserRounds(owner: string, userRounds: UnorderedSet): void {
    this.userRounds.set(owner, userRounds.toArray());
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
      BigInt(betInfo.amount) != BigInt(0) &&
      !betInfo.claimed &&
      ((BigInt(round.closePrice) > BigInt(round.lockPrice) &&
        betInfo.position == Position.Bullish) ||
        (BigInt(round.closePrice) < BigInt(round.lockPrice) &&
          betInfo.position == Position.Bearish))
    );
  }
}
