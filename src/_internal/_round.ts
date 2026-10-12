import type { Rounding } from './_types';

/**
 * 小数 digits 桁に丸める
 *
 * `0.1 * 3` のような誤差で丸めの結果がずれないよう、
 * 掛け算の結果を有効数字 15 桁に整えてから丸める
 */
export default function _round(
  value: number,
  digits: number,
  rounding: Rounding,
): number {
  const factor = 10 ** digits;
  const scaled = Number((value * factor).toPrecision(15));
  // -0 を 0 にする
  return Math[rounding](scaled) / factor || 0;
}

/**
 * 数値の小数の桁数を求める（`1e-7` のような指数表記にも対応する）
 */
export function _countFractionDigits(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const [mantissa, exponent = '0'] = String(value).split('e');
  const fraction = mantissa!.split('.')[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent));
}
