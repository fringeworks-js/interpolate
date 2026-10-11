import { geoFormat } from '../_internal/_points';
import _createPolylineInterpolator, {
  geodesicMetric,
  mercatorMetric,
} from '../_internal/_polyline';
import type { InterpolateGeoPolylineOptions } from './types';

/**
 * 地図上の折れ線を、先頭から全体の長さの t の割合まで引いた折れ線を返す関数を返す
 *
 * 既定ではメルカトル座標の直線（Google Maps / Leaflet の通常の描画）として補間し、
 * `geodesic` を指定した場合は大円に沿って補間する。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度 ±180° をまたぐ区間は近い方向に取り、補間した点の経度は直前の頂点から連続した値にする
 * @param points 折れ線の頂点
 * @param options オプション
 * @returns `t` に応じた折れ線を返す関数
 */
export default function interpolateGeoPolyline<P>(
  points: readonly P[],
  options: InterpolateGeoPolylineOptions<P> = {},
): (t: number) => P[] {
  return _createPolylineInterpolator(
    points,
    geoFormat,
    options.geodesic ? geodesicMetric : mercatorMetric,
    options,
  );
}
