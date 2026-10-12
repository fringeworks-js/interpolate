import { planarFormat } from '../_internal/_points';
import _createPolygonInterpolator, { planarSpace } from '../_internal/_polygon';
import type { InterpolatePolygonOptions } from './types';

/**
 * 基準点を中心に拡大・縮小し、面積 0（t = 0）から元の形（t = 1）まで変化させる関数を返す
 *
 * 座標は画面座標（y が下向き）として扱う。
 * 点は `[x, y]` と `{ x, y }` を自動で判別する。それ以外の形式は
 * `getCoordinates` と `createPoint` で変換する
 * @param polygon リングの配列（GeoJSON の Polygon の形。1つ目が外周、2つ目以降が穴）
 * @param options オプション
 * @returns `t` に応じた形を返す関数
 */
export default function interpolatePolygon<P>(
  polygon: readonly (readonly P[])[],
  options: InterpolatePolygonOptions<P> = {},
): (t: number) => P[][] {
  const interpolate = _createPolygonInterpolator(
    [polygon],
    planarFormat,
    planarSpace,
    options,
  );
  // 1つのポリゴンだけを渡しているので、結果も1つ
  return (t) => interpolate(t)[0]!;
}
