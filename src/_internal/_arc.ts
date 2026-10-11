import { _finiteOr, _nonNegativeOr } from './_numbers';
import type { Coordinates } from './_types';

/**
 * 弧のオプションを補正する
 *
 * `curvature` は有限でない数なら既定値、`segmentCount` は四捨五入し、1 未満や有限でない数なら既定値にする
 */
export const _resolveArcOptions = (
  curvature: number | undefined,
  segmentCount: number | undefined,
): [curvature: number, segmentCount: number] => {
  const count = Math.round(_nonNegativeOr(segmentCount, 64));
  return [_finiteOr(curvature, 0.2), count >= 1 ? count : 64];
};

/**
 * 2点を結ぶ2次ベジェ曲線の弧を、segmentCount 本の線分の頂点として求める
 *
 * 弧の高さは2点間の距離の curvature 倍で、正の値は進行方向の左に膨らむ。
 * yUp は y が大きいほうが上か（画面座標は false、地図のメルカトル座標は true）
 */
export default function _createArcCoordinates(
  [x0, y0]: Coordinates,
  [x2, y2]: Coordinates,
  curvature: number,
  segmentCount: number,
  yUp: boolean,
): Coordinates[] {
  const dx = x2 - x0,
    dy = y2 - y0;
  // 進行方向の左向きで、長さが2点間の距離と同じベクトル
  const [nx, ny] = yUp ? [-dy, dx] : [dy, -dx];
  // 2次ベジェ曲線の頂点の高さは、制御点までの距離の半分になる
  const cx = (x0 + x2) / 2 + nx * curvature * 2,
    cy = (y0 + y2) / 2 + ny * curvature * 2;

  return Array.from({ length: segmentCount + 1 }, (_, k): Coordinates => {
    const s = k / segmentCount,
      u = 1 - s;
    return [
      u * u * x0 + 2 * u * s * cx + s * s * x2,
      u * u * y0 + 2 * u * s * cy + s * s * y2,
    ];
  });
}
