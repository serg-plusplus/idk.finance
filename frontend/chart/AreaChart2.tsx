import {FC, Fragment, useCallback} from "react";
import { bisector } from "d3-array";
import { Group } from '@visx/group';
import {AreaClosed, Bar, Line} from '@visx/shape';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import {accentColor, accentColorDark} from "./Chart";
import {GridColumns, GridRows} from "@visx/grid";
import { localPoint } from "@visx/event";
import {ChartPoint} from "./chart-data";
import {getDate, getStockValue} from "./Chart2";

const bisectDate = bisector<ChartPoint, Date>((d) => new Date(d.time)).left;

// Initialize some variables
const axisColor = '#fff';
const axisBottomTickLabelProps = {
  textAnchor: 'middle' as const,
  fontFamily: 'Arial',
  fontSize: 10,
  fill: axisColor,
};
const axisLeftTickLabelProps = {
  dx: '-0.25em',
  dy: '0.25em',
  fontFamily: 'Arial',
  fontSize: 10,
  textAnchor: 'end' as const,
  fill: axisColor,
};

const AreaChart2: FC<any> = ({
  stock = [],
  gradientColor,
  width,
  yMax,
  margin,
  xScale,
  barData,
  yScale,
  top,
  left,
  children,
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipTop = 0,
  tooltipLeft = 0,
  topChartHeight,
  innerWidth,
}) => {
  if (width < 10) return null;

  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = bisectDate(stock, x0, 1);
      const d0 = stock[index - 1];
      const d1 = stock[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(getDate(d)),
        tooltipTop: yScale(getStockValue(d)),
      });
    },
    [showTooltip, yScale, xScale]
  );

  return (
    <Group left={left || margin.left} top={top || margin.top}>
      <LinearGradient
        id="gradient"
        from={gradientColor}
        fromOpacity={1}
        to={gradientColor}
        toOpacity={0.2}
      />
      <GridRows
        left={margin.left}
        scale={yScale}
        width={innerWidth}
        strokeDasharray="1,3"
        stroke={accentColor}
        strokeOpacity={0}
        pointerEvents="none"
      />
      <GridColumns
        top={margin.top}
        scale={xScale}
        height={topChartHeight}
        strokeDasharray="1,3"
        stroke={accentColor}
        strokeOpacity={0.2}
        pointerEvents="none"
      />
      <AreaClosed
        data={stock}
        x={(d) => xScale(getDate(d)) || 0}
        y={(d) => yScale(getStockValue(d)) || 0}
        yScale={yScale}
        strokeWidth={1}
        stroke="url(#gradient)"
        fill="url(#gradient)"
        curve={curveMonotoneX}
      />
      {barData?.map((d) => {
        if (!d) {
          return null;
        }
        const barWidth = 1;
        const barHeight = yMax;
        const barX = xScale(d.time);
        return (
          <Fragment key={`bar-${d.time}`}>
            <Bar
              x={barX}
              y={0}
              width={barWidth}
              height={barHeight}
              fill="blue"
            />
            <circle
              key={`marker-circle${d.time}`}
              r={3}
              cx={xScale(d.time)}
              cy={yScale(d.price)}
              fill="blue"
            />
            {/*<MarkerCircle id={`marker-circle${d.end}`} fill="blue" size={2} refX={barX} />*/}
          </Fragment>
        );
      })}
      {tooltipData && (
        <g>
          <Line
            from={{ x: tooltipLeft, y: margin.top }}
            to={{ x: tooltipLeft, y: topChartHeight }}
            stroke={accentColorDark}
            strokeWidth={2}
            pointerEvents="none"
            strokeDasharray="5,2"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop + 1}
            r={4}
            fill="black"
            fillOpacity={0.1}
            stroke="black"
            strokeOpacity={0.1}
            strokeWidth={2}
            pointerEvents="none"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop}
            r={4}
            fill={accentColorDark}
            stroke="white"
            strokeWidth={2}
            pointerEvents="none"
          />
        </g>
      )}
      <Bar
        x={-margin.left}
        y={-margin.top}
        width={innerWidth}
        height={topChartHeight + margin.top + 24}
        fill="transparent"
        rx={14}
        onTouchStart={handleTooltip}
        onTouchMove={handleTooltip}
        onMouseMove={handleTooltip}
        onMouseLeave={() => hideTooltip()}
      />
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={width > 520 ? 10 : 5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={() => axisBottomTickLabelProps}
        />
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={() => axisLeftTickLabelProps}
        />
      {children}
    </Group>
  );
}

export default AreaChart2;