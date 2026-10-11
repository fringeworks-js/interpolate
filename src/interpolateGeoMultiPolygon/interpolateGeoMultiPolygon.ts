import { geoFormat } from '../_internal/_points';
import _createPolygonInterpolator, {
  mercatorSpace,
} from '../_internal/_polygon';
import type { InterpolateGeoMultiPolygonOptions } from './types';

/**
 * 地図上で基準点を中心に拡大・縮小し、面積 0（t = 0）から元の形（t = 1）まで変化させる関数を返す
 *
 * メルカトル座標に投影してから拡大・縮小する。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度 ±180° をまたぐリングは近い方向に取り、元の点の経度から連続した値にする
 * @param polygons ポリゴンの配列（GeoJSON の MultiPolygon の形）
 * @param options オプション
 * @returns `t` に応じた形を返す関数
 */
export default function interpolateGeoMultiPolygon<P>(
  polygons: readonly (readonly (readonly P[])[])[],
  options: InterpolateGeoMultiPolygonOptions<P> = {},
): (t: number) => P[][][] {
  return _createPolygonInterpolator(
    polygons,
    geoFormat,
    mercatorSpace,
    options,
  );
}
