/**
 * Oracle response typing for:
 * NEAR_ENV=mainnet near view priceoracle.near get_price_data
 */

export interface Price {
  multiplier: string;
  decimals: number;
}

export interface Asset {
  asset_id: string;
  price: Price;
}

export interface PricesResponse {
  timestamp: string;
  recency_duration_sec: number;
  prices: Asset[];
}
