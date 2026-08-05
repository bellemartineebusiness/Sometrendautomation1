interface SparklinePoint {
  x: number;
  y: number;
}

interface Sparkline {
  polyline: string;
  polygon: string;
  last: SparklinePoint;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildSparkline(
  values: number[],
  width: number,
  height: number,
  padding = 4
): Sparkline {
  if (values.length < 2) {
    throw new Error("sparkline requires at least 2 data points");
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableHeight = height - padding * 2;
  const step = width / (values.length - 1);

  const points: SparklinePoint[] = values.map((v, i) => ({
    x: round(i * step),
    y: round(padding + usableHeight - ((v - min) / range) * usableHeight),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const polygon = `${polyline} ${width},${height} 0,${height}`;

  return { polyline, polygon, last: points[points.length - 1] };
}
