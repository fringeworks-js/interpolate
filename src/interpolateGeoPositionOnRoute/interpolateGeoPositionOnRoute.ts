import { geoFormat } from '../_internal/_points';
import { geodesicMetric, mercatorMetric } from '../_internal/_polyline';
import _createRoutePositionInterpolator from '../_internal/_route';
import type {
  GeoRoutePosition,
  InterpolateGeoPositionOnRouteOptions,
} from './types';

/**
 * 地図上の折れ線をルートとして、先頭から全体の長さの t の割合の位置と進行方向の方位を返す関数を返す
 *
 * 既定ではメルカトル座標の直線（Google Maps / Leaflet の通常の描画）として扱い、方位も画面上の向きにする。
 * `geodesic` を指定した場合は大円に沿って補間し、方位もその位置での大円の向きにする。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する
 * @param route ルートの頂点
 * @param options オプション
 * @returns `t` に応じた位置と方位を返す関数
 */
export default function interpolateGeoPositionOnRoute<P>(
  route: readonly P[],
  options: InterpolateGeoPositionOnRouteOptions<P> = {},
): (t: number) => GeoRoutePosition<P> {
  const interpolate = _createRoutePositionInterpolator(
    route,
    geoFormat,
    options.geodesic ? geodesicMetric : mercatorMetric,
    options,
  );
  return (t) => {
    const { point, direction } = interpolate(t);
    return { point, heading: direction };
  };
}
