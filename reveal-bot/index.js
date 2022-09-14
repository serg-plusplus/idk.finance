import {
  connect,
  Contract,
  KeyPair,
  keyStores,
  Account,
  InMemorySigner,
} from "near-api-js";

import config from "./config.js";

schedule(3_000, async () => {
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(
    config.network,
    config.accountId,
    KeyPair.fromString(config.accountSk)
  );

  const connectionConfig = {
    networkId: config.network,
    accountId: config.accountId,
    keyStore, // first create a key store
    signer: new InMemorySigner(keyStore),
    ...(config.network
      ? {
          nodeUrl: "https://rpc.testnet.near.org",
          walletUrl: "https://wallet.testnet.near.org",
          helperUrl: "https://helper.testnet.near.org",
          explorerUrl: "https://explorer.testnet.near.org",
        }
      : {
          nodeUrl: "https://rpc.mainnet.near.org",
          walletUrl: "https://wallet.mainnet.near.org",
          helperUrl: "https://helper.mainnet.near.org",
          explorerUrl: "https://explorer.mainnet.near.org",
        }),
  };

  const near = await connect(connectionConfig);
  const acc = new Account(near.connection, config.accountId);

  const contract = new Contract(
    acc, // the account object that is connecting
    config.contractId,
    {
      // name of contract you're connecting to
      viewMethods: ["getState", "getRound"], // view methods do not change state but usually return a value
      changeMethods: ["reveal", "genesisStartRound", "genesisLockRound"], // change methods modify state
      sender: acc, // account object to initialize and sign transactions.
    }
  );

  const state = await contract.getState();

  console.info({ state });

  if (!state.genesisStartOnce) {
    await contract.genesisStartRound({
      args: {},
      gas: "300000000000000", // attached GAS (optional)
    });
    return;
  } else if (!state.genesisLockOnce) {
    await contract.genesisLockOnce({
      args: {},
      gas: "300000000000000", // attached GAS (optional)
    });
    return;
  } else {
    const round = await contract.getRound({
      args: { epoch: state.currentEpoch },
    });

    if (new Date(round.lockTimestamp) < new Date()) {
      await contract.reveal({
        args: {},
        gas: "300000000000000", // attached GAS (optional)
      });
    }
  }

  const result = await contract.genesisStartRound({
    args: {},
    gas: "300000000000000", // attached GAS (optional)
  });

  console.info({ result });
});

async function schedule(notMoreOftenThan, factory) {
  const startedAt = Date.now();
  try {
    await factory();
  } catch (err) {
    console.error(err);
  } finally {
    const scheduleThrough = Math.max(
      notMoreOftenThan - (Date.now() - startedAt),
      0
    );
    setTimeout(schedule, scheduleThrough, notMoreOftenThan, factory);
  }
}
