import {useRef, useState, useMemo, FC} from 'react';
import {min, max, extent} from 'd3-array';
import { timeFormat } from "d3-time-format";
import {Card} from "@nextui-org/react";
import {scaleTime, scaleLinear} from '@visx/scale';
import {Brush} from '@visx/brush';
import {Bounds} from '@visx/brush/lib/types';
import BaseBrush, {BaseBrushState, UpdateBrush} from '@visx/brush/lib/BaseBrush';
import {PatternLines} from '@visx/pattern';
import {Group} from '@visx/group';
import {LinearGradient} from '@visx/gradient';
import {defaultStyles, Tooltip, TooltipWithBounds, withTooltip} from "@visx/tooltip";
import {WithTooltipProvidedProps} from "@visx/tooltip/lib/enhancers/withTooltip";
import AreaChart from './AreaChart';
import AreaChart2 from './AreaChart2';
import {ChartPoint} from "./chart-data";
import {useIdkState} from "../idk-state";

// Initialize some variables
const brushMargin = {top: 10, bottom: 15, left: 50, right: 20};
const chartSeparation = 30;
const PATTERN_ID = 'brush_pattern';
const GRADIENT_ID = 'brush_gradient';
export const accentColor = '#f6acc8';
export const background = '#584153';
export const background2 = '#af8baf';
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: 'white',
};
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: "1px solid white",
  color: "white",
};

// accessors
const getDate = (d) => new Date(d[0]);
const getDateRounds = (d) => new Date(d);
const getStockValue = (d) => d[1];
const formatDate = timeFormat("%I:%M:%I %p %b %d, '%y");

export type BrushProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  stock?: any;
};

type TooltipData = ChartPoint;

const rounds = [
  {
    end: 1663113379000,
    start: 1663111579000,
  },
  {
    end: 1663111579000,
    start: 1663109779000,
  },
  {
    end: 1663109779000,
    start: 1663107979000,
  },
]

const BrushChart: FC = withTooltip<BrushProps, TooltipData>(({
  width,
  height,
  margin = {
    top: 20,
    left: 50,
    bottom: 20,
    right: 20,
  },
  stock = {prices: []},
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipTop = 0,
  tooltipLeft = 0,
}) => {
  const state = useIdkState();
  console.log('state', state)
  const brushRef = useRef<BaseBrush | null>(null);
  const finalData = useMemo(() => [...stock.prices, [1663114401000, null]], [stock.prices])

  const [filteredStock, setFilteredStock] = useState(stock.prices);

  const filteredDataRounds = useMemo(() => rounds.map(round => {
    console.log('round.end', round.end, filteredStock[0][0], filteredStock[filteredStock.length - 1][0])
    if (round.end >= filteredStock[0][0] && round.end <= filteredStock[filteredStock.length - 1][0]) {
      return round.end;
    }
  }), [filteredStock])


  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    const {x0, x1, y0, y1} = domain;
    const stockCopy = stock.prices.filter((s) => {
      const x = getDate(s).getTime();
      const y = getStockValue(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    });
    setFilteredStock(stockCopy);
  };

  const innerHeight = height - margin.top - margin.bottom;
  const topChartBottomMargin = chartSeparation + 10;
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation;

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(topChartHeight, 0);
  const xBrushMax = Math.max(width - brushMargin.left - brushMargin.right, 0);
  const yBrushMax = Math.max(bottomChartHeight - brushMargin.top - brushMargin.bottom, 0);

  // scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: extent(filteredStock, getDate) as [Date, Date],
      }),
    [xMax, filteredStock],
  );
  const dateScaleRounds = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: extent(filteredDataRounds, getDateRounds) as [Date, Date],
      }),
    [xMax, filteredDataRounds],
  );
  const stockScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [min(filteredStock, getStockValue) || 0, max(filteredStock, getStockValue) || 0],
        nice: true,
      }),
    [yMax, filteredStock],
  );
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: extent(stock.prices, getDate) as [Date, Date],
      }),
    [xBrushMax],
  );
  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [min(stock.prices, getStockValue) || 0, max(stock.prices, getStockValue) || 0],
        nice: true,
      }),
    [yBrushMax],
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: {x: brushDateScale(getDate(stock.prices[stock.prices.length ? stock.prices.length - 40 : 50]))},
      end: {x: brushDateScale(getDate(stock.prices[stock.prices.length ? stock.prices.length - 1 : 100]))},
    }),
    [brushDateScale],
  );

  return (
    <Card css={{width, marginLeft: "auto", marginRight: "auto"}}>
      <svg width={width} height={height}>
        <LinearGradient id={GRADIENT_ID} from={background} to={background2} rotate={45}/>
        <rect x={0} y={0} width={width} height={height} fill={`url(#${GRADIENT_ID})`} rx={14}/>
        <AreaChart2
          stock={filteredStock}
          width={width}
          margin={{...margin, bottom: topChartBottomMargin}}
          yMax={yMax}
          xScale={dateScale}
          xScaleRounds={dateScaleRounds}
          yScale={stockScale}
          gradientColor={background2}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
          tooltipData={tooltipData}
          tooltipTop={tooltipTop}
          tooltipLeft={tooltipLeft}
          topChartHeight={topChartHeight}
          innerWidth={width - margin.right}
        />
        <AreaChart
          stock={stock.prices}
          width={width}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushStockScale}
          margin={brushMargin}
          top={topChartHeight + topChartBottomMargin + margin.top}
          gradientColor={background2}
        >
          <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke={accentColor}
            strokeWidth={1}
            orientation={['diagonal']}
          />
          <Brush
            xScale={brushDateScale}
            yScale={brushStockScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={brushMargin}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={['left', 'right']}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            onClick={() => setFilteredStock(stock.prices)}
            selectedBoxStyle={selectedBrushStyle}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          />
        </AreaChart>
      </svg>
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop - 24}
            left={tooltipLeft + 12}
            style={tooltipStyles}
          >
            {`$${getStockValue(tooltipData)}`}
          </TooltipWithBounds>
          <Tooltip
            top={topChartHeight + margin.top - 10}
            left={tooltipLeft}
            style={{
              ...defaultStyles,
              minWidth: 72,
              textAlign: "center",
              transform: "translateX(-50%)",
            }}
          >
            {formatDate(getDate(tooltipData))}
          </Tooltip>
        </div>
      )}
    </Card>
  );
});

// We need to manually offset the handles for them to be rendered at the right position
const BrushHandle = ({x, height, isBrushActive}: any) => {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{cursor: 'ew-resize'}}
      />
    </Group>
  );
};

export default BrushChart;