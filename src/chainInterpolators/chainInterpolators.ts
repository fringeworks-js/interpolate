import { _nonNegativeOr } from '../_internal/_numbers';
import type { Interpolator } from '../_internal/_types';
import type { ChainedValue, ChainInterpolatorsOptions } from './types';

type Segment = {
  /**
   * 区間内の t から値を求める関数（待機の区間は t を使わない）
   */
  interpolate: Interpolator<unknown>;
  hold: boolean;
  start: number;
  end: number;
};

/**
 * 複数の interpolator を順番に再生する interpolator を返す
 *
 * 0 〜 1 を `weights` の比で区間に分け、t が入っている区間の interpolator に、
 * 区間内に直した t を渡した値を返す。区間の境目ちょうどの t は後ろの区間に入れる。
 * `null` の区間は待機で、直前の interpolator の終わりの値（先頭の場合は次の interpolator の始まりの値）を返す。
 * 範囲外の t は、最初または最後の interpolator にそのまま延長した t を渡す
 * @param interpolators 順番に再生する interpolator。`null` は待機の区間
 * @param options オプション
 * @returns 合成した interpolator
 */
export default function chainInterpolators<
  const I extends readonly (Interpolator<unknown> | null)[],
>(
  interpolators: I,
  options: ChainInterpolatorsOptions = {},
): Interpolator<ChainedValue<I>> {
  const { ease } = options;
  if (interpolators.every((interpolator) => interpolator === null)) {
    throw new RangeError('At least one interpolator is required.');
  }

  // 足りない重みや、負の数・有限でない数の重みは 1 にし、合計が 0 なら均等に分ける
  let weights = interpolators.map((_, i) =>
    _nonNegativeOr(options.weights?.[i], 1),
  );
  if (weights.every((weight) => weight === 0)) {
    weights = weights.map(() => 1);
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  // 待機の区間で返す値の求め方（直前の終わり、なければ次の始まり）
  const createHold = (i: number): Interpolator<unknown> => {
    for (let j = i - 1; j >= 0; j--) {
      const previous = interpolators[j];
      if (previous) {
        return () => previous(1);
      }
    }
    const next = interpolators.slice(i + 1).find(Boolean)!;
    return () => next(0);
  };

  // 長さのある区間だけを残す
  // 境目は重みの累計から求め、最後の区間の終わりがちょうど 1 になるようにする
  const segments: Segment[] = [];
  let sum = 0;
  interpolators.forEach((interpolator, i) => {
    const start = sum / total;
    const weight = weights[i]!;
    sum += weight;
    if (weight > 0) {
      segments.push({
        interpolate: interpolator ?? createHold(i),
        hold: interpolator === null,
        start,
        end: sum / total,
      });
    }
  });

  return ((t: number) => {
    let index = 0;
    for (let i = segments.length - 1; i > 0; i--) {
      if (segments[i]!.start <= t) {
        index = i;
        break;
      }
    }
    // 重みの合計は 0 より大きいので、長さのある区間が必ず1つ以上ある
    const { interpolate, hold, start, end } = segments[index]!;
    const local = (t - start) / (end - start);
    return interpolate(hold || !ease ? local : ease(local));
  }) as Interpolator<ChainedValue<I>>;
}
