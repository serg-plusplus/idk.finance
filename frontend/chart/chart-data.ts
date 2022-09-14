/**
 * Chart resolution is automatic, period of time is set in days
 */

const CHART_DATA_URL =
  "https://api.coingecko.com/api/v3/coins/near/market_chart?vs_currency=usd&days=0.1";

export type ChartPoint = [number, number];
export type ChartData = {
  prices: ChartPoint[];
};

export async function getChartData(): Promise<ChartData> {
  const request = await fetch(CHART_DATA_URL);
  return request.json();
}
