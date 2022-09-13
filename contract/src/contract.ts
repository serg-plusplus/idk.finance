import { NearBindgen, near, call, view, initialize, assert } from "near-sdk-js";

@NearBindgen({})
class PredictionMarket {
  owner: string = "admin.idk.near";
  pendingOwner: string = "";
  manager: string = "manager.idk.near";

  minBid: number = 1000;
  duration: number = 1800;

  feeRate: number = 10;
  feePrecision: number = 1000;
  feeTreasury: number = 0;

  currentEpoch: number = 0;

  @initialize({})
  init({ owner, manager }: { owner: string; manager: string }) {
    this.owner = owner;
    this.manager = manager;
  }

  // ADMIN

  @call({})
  setMinBid({ minBid }: { minBid: number }): void {
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
    this.feeTreasury = 0;
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
  @call({ privateFunction: true })
  _assertOwner(): void {
    assert(near.predecessorAccountId() == this.owner, "Not an owner");
  }

  @call({ privateFunction: true })
  _assertPendingOwner(): void {
    assert(near.predecessorAccountId() == this.pendingOwner, "Not an owner");
  }

  // bet
  // claim
  // reveal
  // setOracle
  // setFee
}
