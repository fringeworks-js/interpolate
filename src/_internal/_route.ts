import type { PointFormat } from './_points';
import type { PolylineMetric } from './_polyline';
import { _measurePolyline } from './_polyline';
import type { Coordinates, RouteOptions } from './_types';

/**
 * ルート上の位置と向き
 */
export type RoutePoint<P> = {
  point: P;
  /**
   * 向き（度）。平面は x 軸の正の方向から時計回り、地図は北から時計回り
   */
  direction: number;
};

/**
 * ルート上の位置を求める補間関数を作る
 */
export default function _createRoutePositionInterpolator<P>(
  points: readonly P[],
  format: PointFormat,
  createMetric: (coordinates: Coordinates[]) => PolylineMetric,
  options: RouteOptions<P>,
): (t: number) => RoutePoint<P> {
  if (!points.length) {
    throw new RangeError('At least one point is required.');
  }
  const { extrapolateStart = false, extrapolateEnd = false } = options;
  const { source, metric, lengths, total, first, last, find, pointAt } =
    _measurePolyline(points, format, createMetric, options);
  const end = source[source.length - 1];

  const at = (i: number, ratio: number): RoutePoint<P> => ({
    point: pointAt(i, ratio),
    direction: metric.direction(i, ratio),
  });

  return (t) => {
    if (total === 0) {
      return { point: t >= 1 ? end : source[0], direction: 0 };
    } else if (t <= 0) {
      if (t < 0 && extrapolateStart) {
        return at(first, (t * total) / lengths[first]);
      }
      return { point: source[0], direction: metric.direction(first, 0) };
    } else if (t >= 1) {
      if (t > 1 && extrapolateEnd) {
        return at(last, 1 + ((t - 1) * total) / lengths[last]);
      }
      return { point: end, direction: metric.direction(last, 1) };
    }

    const [i, ratio] = find(t * total);
    // 頂点ちょうどの位置では元の点を返す
    return ratio > 0
      ? at(i, ratio)
      : { point: source[i], direction: metric.direction(i, 0) };
  };
}
