import { Group } from '@visx/group';
import { AreaClosed } from '@visx/shape';
import { AxisScale } from '@visx/axis';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import {getDate, getStockValue} from "./Chart2";

export default function AreaChart({
  stock = [],
  gradientColor,
  width,
  yMax,
  margin,
  xScale,
  yScale,
  top,
  left,
  children,
}: {
  stock: any;
  gradientColor: string;
  xScale: AxisScale<number>;
  yScale: AxisScale<number>;
  width: number;
  yMax: number;
  margin: { top: number; right: number; bottom: number; left: number };
  top?: number;
  left?: number;
  children?: React.ReactNode;
}) {
  if (width < 10) return null;

  return (
    <Group left={left || margin.left} top={top || margin.top}>
      <LinearGradient
        id="gradient"
        from={gradientColor}
        fromOpacity={1}
        to={gradientColor}
        toOpacity={0.2}
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
      {children}
    </Group>
  );
}
