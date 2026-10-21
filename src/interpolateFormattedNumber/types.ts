export type { Rounding } from '../_internal/_types';
import type { Rounding } from '../_internal/_types';

/**
 * 数値を文字列にする関数、または `Intl.NumberFormat`
 */
export type NumberFormatter = Intl.NumberFormat | ((value: number) => string);

/**
 * `interpolateFormattedNumber` のオプション
 */
export type InterpolateFormattedNumberOptions = {
  /**
   * 数値を文字列にする関数、または `Intl.NumberFormat`。デフォルトは実行環境のロケールの `Intl.NumberFormat` で、小数を `fractionDigits` 桁（20 桁まで）に固定して表示する
   */
  formatter?: NumberFormatter;
  /**
   * 途中の値を丸める小数の桁数。小数は四捨五入し、負の数・有限でない数の場合はデフォルトにする。デフォルトは `a` と `b` の小数の桁数の多い方
   */
  fractionDigits?: number;
  /**
   * 丸め方。デフォルトは `'round'`
   */
  rounding?: Rounding;
};
