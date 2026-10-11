import { planarFormat } from '../_internal/_points';
import _createPolygonInterpolator, { planarSpace } from '../_internal/_polygon';
import type { InterpolateMultiPolygonOptions } from './types';

/**
 * 基準点を中心に拡大・縮小し、面積 0（t = 0）から元の形（t = 1）まで変化させる関数を返す
 *
 * 座標は画面座標（y が下向き）として扱う。
 * 点は `[x, y]` と `{ x, y }` を自動で判別する。それ以外の形式は
 * `getCoordinates` と `createPoint` で変換する
 * @param polygons ポリゴンの配列（GeoJSON の MultiPolygon の形）
 * @param options オプション
 * @returns `t` に応じた形を返す関数
 */
export default function interpolateMultiPolygon<P>(
  polygons: readonly (readonly (readonly P[])[])[],
  options: InterpolateMultiPolygonOptions<P> = {},
): (t: number) => P[][][] {
  return _createPolygonInterpolator(
    polygons,
    planarFormat,
    planarSpace,
    options,
  );
}
