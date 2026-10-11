import { planarFormat } from '../_internal/_points';
import { planarMetric } from '../_internal/_polyline';
import _createRoutePositionInterpolator from '../_internal/_route';
import type { InterpolatePositionOnRouteOptions, RoutePosition } from './types';

/**
 * 折れ線をルートとして、先頭から全体の長さの t の割合の位置と進行方向を返す関数を返す
 *
 * 点は `[x, y]` と `{ x, y }` を自動で判別する。それ以外の形式は
 * `getCoordinates` と `createPoint` で変換する。
 * 頂点ちょうどの位置では元の点を返し、向きはこれから進む区間の向き（終点では最後の区間の向き）にする
 * @param route ルートの頂点
 * @param options オプション
 * @returns `t` に応じた位置と向きを返す関数
 */
export default function interpolatePositionOnRoute<P>(
  route: readonly P[],
  options: InterpolatePositionOnRouteOptions<P> = {},
): (t: number) => RoutePosition<P> {
  const interpolate = _createRoutePositionInterpolator(
    route,
    planarFormat,
    planarMetric,
    options,
  );
  return (t) => {
    const { point, direction } = interpolate(t);
    return { point, angle: direction };
  };
}
