import { geoFormat } from '../_internal/_points';
import _createPolygonInterpolator, {
  mercatorSpace,
} from '../_internal/_polygon';
import type { InterpolateGeoPolygonOptions } from './types';

/**
 * 地図上で基準点を中心に拡大・縮小し、面積 0（t = 0）から元の形（t = 1）まで変化させる関数を返す
 *
 * メルカトル座標に投影してから拡大・縮小する。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度 ±180° をまたぐリングは近い方向に取り、元の点の経度から連続した値にする
 * @param polygon リングの配列（GeoJSON の Polygon の形。1つ目が外周、2つ目以降が穴）
 * @param options オプション
 * @returns `t` に応じた形を返す関数
 */
export default function interpolateGeoPolygon<P>(
  polygon: readonly (readonly P[])[],
  options: InterpolateGeoPolygonOptions<P> = {},
): (t: number) => P[][] {
  const interpolate = _createPolygonInterpolator(
    [polygon],
    geoFormat,
    mercatorSpace,
    options,
  );
  return (t) => interpolate(t)[0];
}
