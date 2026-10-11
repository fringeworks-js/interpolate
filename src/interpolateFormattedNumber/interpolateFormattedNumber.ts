import { _nonNegativeOr } from '../_internal/_numbers';
import _round, { _countFractionDigits } from '../_internal/_round';
import type { InterpolateFormattedNumberOptions } from './types';

/**
 * 数値を補間し、書式化した文字列を返す関数を返す
 *
 * 途中の値は `fractionDigits` 桁に丸めてから書式化する。
 * 既定では `a` と `b` の小数の桁数の多い方に丸めるので、整数どうしなら途中も整数になる
 * @param a 補間前の数値（t = 0 のときの値）
 * @param b 補間後の数値（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた文字列を返す関数
 */
export default function interpolateFormattedNumber(
  a: number,
  b: number,
  options: InterpolateFormattedNumberOptions = {},
): (t: number) => string {
  const { formatter = new Intl.NumberFormat(), rounding = 'round' } = options;
  // 小数は四捨五入し、負の数や有限でない数は a と b から求めた桁数にする
  const fractionDigits = Math.min(
    100,
    Math.round(
      _nonNegativeOr(
        options.fractionDigits,
        Math.max(_countFractionDigits(a), _countFractionDigits(b)),
      ),
    ),
  );
  const format =
    typeof formatter === 'function'
      ? formatter
      : (value: number) => formatter.format(value);

  return (t) => {
    const value = t <= 0 ? a : t >= 1 ? b : a + (b - a) * t;
    return format(_round(value, fractionDigits, rounding));
  };
}
