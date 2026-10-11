import _createPolylineMorphInterpolator from '../_internal/_morph';
import { planarFormat } from '../_internal/_points';
import { planarSpace } from '../_internal/_polygon';
import type { InterpolatePolylineMorphOptions } from './types';

/**
 * 折れ線を別の折れ線へ変形させる関数を返す
 *
 * 両方の頂点の位置（全体の長さに対する割合）を合わせた点で両方を打ち直し、対応する点どうしを線形に補間する。
 * どちらの角も途中で丸まらない。
 * 点は `[x, y]` と `{ x, y }` を自動で判別する。それ以外の形式は `getCoordinates` と `createPoint` で変換する。
 * t ≤ 0 では `a`、t ≥ 1 では `b` を、元の点のまま新しい配列で返す。
 * どちらかの折れ線に点がない場合は、点のある側の `origin`（既定は始点）から広がる、またはそこへ縮む
 * @param a 補間前の折れ線（t = 0 のときの値）
 * @param b 補間後の折れ線（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた折れ線を返す関数
 */
export default function interpolatePolylineMorph<P>(
  a: readonly P[],
  b: readonly P[],
  options: InterpolatePolylineMorphOptions<P> = {},
): (t: number) => P[] {
  return _createPolylineMorphInterpolator(
    a,
    b,
    planarFormat,
    planarSpace,
    options,
  );
}
