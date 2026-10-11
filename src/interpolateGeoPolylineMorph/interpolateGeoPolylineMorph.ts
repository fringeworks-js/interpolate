import _createPolylineMorphInterpolator from '../_internal/_morph';
import { geoFormat } from '../_internal/_points';
import { mercatorSpace } from '../_internal/_polygon';
import type { InterpolateGeoPolylineMorphOptions } from './types';

/**
 * 地図上の折れ線を別の折れ線へ変形させる関数を返す
 *
 * メルカトル座標に投影し、両方の頂点の位置（全体の長さに対する割合）を合わせた点で両方を打ち直して、
 * 対応する点どうしを線形に補間する。
 * 点は `[lng, lat]`（GeoJSON の順）と `{ lat, lng }` を自動で判別する。
 * 経度は近い方向に取り、新しく作る点の経度は元の点の経度から連続した値にする。
 * どちらかの折れ線に点がない場合は、点のある側の `origin`（既定は始点）から広がる、またはそこへ縮む
 * @param a 補間前の折れ線（t = 0 のときの値）
 * @param b 補間後の折れ線（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた折れ線を返す関数
 */
export default function interpolateGeoPolylineMorph<P>(
  a: readonly P[],
  b: readonly P[],
  options: InterpolateGeoPolylineMorphOptions<P> = {},
): (t: number) => P[] {
  return _createPolylineMorphInterpolator(
    a,
    b,
    geoFormat,
    mercatorSpace,
    options,
  );
}
