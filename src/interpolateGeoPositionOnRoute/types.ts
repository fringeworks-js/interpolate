import type { RouteOptions } from '../_internal/_types';

export type { Coordinates, PolylinePointContext } from '../_internal/_types';

/**
 * `interpolateGeoPositionOnRoute` のオプション
 */
export type InterpolateGeoPositionOnRouteOptions<P> = RouteOptions<P> & {
  /**
   * 大円に沿って補間する（Google Maps の Polyline の `geodesic` と同じ）
   */
  geodesic?: boolean;
};

/**
 * 地図のルート上の位置
 */
export type GeoRoutePosition<P> = {
  /**
   * 位置の点
   */
  point: P;
  /**
   * 進行方向の方位（度）。北から時計回りで、-180 〜 180
   */
  heading: number;
};
