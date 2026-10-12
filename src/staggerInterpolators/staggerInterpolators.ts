import _createStaggerRanges, { _toLocal } from '../_internal/_stagger';
import type { Interpolator } from '../_internal/_types';
import type { StaggeredValues, StaggerInterpolatorsOptions } from './types';

/**
 * 複数の interpolator を少しずつずらして同時に再生する interpolator を返す
 *
 * 全ての interpolator の値を配列で返す。
 * 各 interpolator には、それぞれの範囲内に直した t を 0 〜 1 に制限して渡すため、
 * 始まる前は 0 の状態、終わった後は 1 の状態で止まる
 * @param interpolators 再生する interpolator
 * @param options オプション
 * @returns 合成した interpolator
 */
export default function staggerInterpolators<
  const I extends readonly Interpolator<unknown>[],
>(
  interpolators: I,
  options: StaggerInterpolatorsOptions = {},
): Interpolator<StaggeredValues<I>> {
  const { stagger = 0.5, ranges, ease } = options;
  const count = interpolators.length;

  // ranges が足りない分は stagger から求めた区間で補い、余った分は無視する
  const staggered = _createStaggerRanges(count, stagger, 0.5);
  const resolved = staggered.map((range, i) => ranges?.[i] ?? range);

  return ((t: number) =>
    interpolators.map((interpolator, i) => {
      const local = _toLocal(t, resolved[i]!);
      return interpolator(ease ? ease(local) : local);
    })) as Interpolator<StaggeredValues<I>>;
}
