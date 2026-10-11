import type { RouteOptions } from '../_internal/_types';

export type { Coordinates, PolylinePointContext } from '../_internal/_types';

/**
 * `interpolatePositionOnRoute` のオプション
 */
export type InterpolatePositionOnRouteOptions<P> = RouteOptions<P>;

/**
 * ルート上の位置
 */
export type RoutePosition<P> = {
  /**
   * 位置の点
   */
  point: P;
  /**
   * 進行方向の角度（度）。x 軸の正の方向から時計回り（画面座標）で、-180 〜 180
   */
  angle: number;
};
