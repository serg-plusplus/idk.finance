#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/PredictionMarket.ts build/prediction_market.wasm
