import { _nonNegativeOr } from './_numbers';

/**
 * `stagger` から、count 個の区間 `[start, end]` を求める
 *
 * `stagger` は次の開始までの間隔を1つ分の長さに対する割合で表し、
 * 全体が 0 〜 1 に収まるように1つ分の長さを決める。
 * `stagger` が負の数・有限でない数の場合は fallback を使う
 */
export default function _createStaggerRanges(
  count: number,
  value: number | undefined,
  fallback: number,
): [number, number][] {
  const stagger = _nonNegativeOr(value, fallback);
  const duration = 1 / (1 + (count - 1) * stagger);
  return Array.from({ length: count }, (_, i) => {
    const start = i * stagger * duration;
    return [start, i === count - 1 ? 1 : start + duration];
  });
}

/**
 * t を区間 `[start, end]` の中の 0 〜 1 に直す（範囲外は 0 / 1 に制限する）
 *
 * 長さのない区間は、開始の前は 0、開始以降は 1 にする
 */
export function _toLocal(t: number, [start, end]: readonly [number, number]) {
  if (end > start) {
    return Math.max(0, Math.min(1, (t - start) / (end - start)));
  }
  return t < start ? 0 : 1;
}
