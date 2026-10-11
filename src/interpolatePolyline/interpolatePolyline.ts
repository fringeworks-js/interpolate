import { planarFormat } from '../_internal/_points';
import _createPolylineInterpolator, {
  planarMetric,
} from '../_internal/_polyline';
import type { InterpolatePolylineOptions } from './types';

/**
 * 折れ線を、先頭から全体の長さの t の割合まで引いた折れ線を返す関数を返す
 *
 * 点は `[x, y]` と `{ x, y }` を自動で判別する。それ以外の形式は
 * `getCoordinates` と `createPoint` で変換する。
 * 返す配列は毎回新しく作り、元の点は同じ参照のまま入れる
 * @param points 折れ線の頂点
 * @param options オプション
 * @returns `t` に応じた折れ線を返す関数
 */
export default function interpolatePolyline<P>(
  points: readonly P[],
  options: InterpolatePolylineOptions<P> = {},
): (t: number) => P[] {
  return _createPolylineInterpolator(
    points,
    planarFormat,
    planarMetric,
    options,
  );
}
