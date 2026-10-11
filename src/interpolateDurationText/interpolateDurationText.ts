import _round from '../_internal/_round';
import type { InterpolateDurationTextOptions } from './types';

type DurationText = {
  /**
   * 秒数
   */
  seconds: number;
  /**
   * コロンで区切った各部分の桁数（1 〜 3 個）
   */
  widths: number[];
  /**
   * 秒の小数の桁数
   */
  fractionDigits: number;
};

const PATTERN = /^(\d+)(?::(\d+))?(?::(\d+))?(?:\.(\d+))?$/;

/**
 * `h:mm:ss` / `mm:ss` / `ss` の形式（秒は小数も可）の文字列を読み取る
 */
const parse = (text: string): DurationText => {
  const match = PATTERN.exec(text);
  if (!match) {
    throw new TypeError(`Invalid duration text: ${JSON.stringify(text)}.`);
  }
  const fields = match.slice(1, 4).filter((field) => field !== undefined);
  const fraction = match[4] ?? '';
  return {
    seconds:
      fields.reduce((sum, field) => sum * 60 + Number(field), 0) +
      (fraction ? Number(`0.${fraction}`) : 0),
    widths: fields.map((field) => field.length),
    fractionDigits: fraction.length,
  };
};

/**
 * 秒数を、widths と fractionDigits の形式の文字列にする
 */
const format = (
  units: number,
  { widths, fractionDigits }: Omit<DurationText, 'seconds'>,
): string => {
  const scale = 10 ** fractionDigits;
  let seconds = Math.floor(units / scale);
  const fraction = units - seconds * scale;

  // 最後の部分から順に 60 で割っていき、最初の部分は 60 を超えてもそのまま表示する
  const fields: number[] = [];
  for (let i = widths.length - 1; i > 0; i--) {
    fields.unshift(seconds % 60);
    seconds = Math.floor(seconds / 60);
  }
  fields.unshift(seconds);

  const text = fields
    .map((field, i) => String(field).padStart(widths[i], '0'))
    .join(':');
  return fractionDigits
    ? `${text}.${String(fraction).padStart(fractionDigits, '0')}`
    : text;
};

/**
 * 時間の文字列（`h:mm:ss` / `mm:ss` / `ss`、秒は小数も可）を補間する関数を返す
 *
 * 全体を秒数に直してから補間するので、`00:59` → `01:00` のような繰り上がりも自然につながる。
 * 途中の文字列は `b` の形式（区切りの数・ゼロ埋めの桁数・小数の桁数）に合わせ、`b` の最小の単位に丸める。
 * 最初の部分のゼロ埋めは、区切りの数が同じなら `a` と `b` の少ない方の桁数にする。
 * 最初の部分は 60 や 24 を超えてもそのまま表示する
 * @param a 補間前の文字列（t = 0 のときの値）
 * @param b 補間後の文字列（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた文字列を返す関数
 */
export default function interpolateDurationText(
  a: string,
  b: string,
  options: InterpolateDurationTextOptions = {},
): (t: number) => string {
  const { rounding = 'round' } = options;
  const from = parse(a),
    to = parse(b);
  const scale = 10 ** to.fractionDigits;
  // 最初の部分のゼロ埋めは、区切りの数が同じなら a と b の少ない方の桁数にする（例: 5:00 → 10:00 の途中は 7:30）
  const widths = to.widths.slice();
  if (from.widths.length === widths.length) {
    widths[0] = Math.min(from.widths[0], widths[0]);
  }
  const output = { widths, fractionDigits: to.fractionDigits };

  return (t) => {
    if (t <= 0) {
      return a;
    } else if (t >= 1) {
      return b;
    }
    const seconds = from.seconds + (to.seconds - from.seconds) * t;
    return format(_round(seconds * scale, 0, rounding), output);
  };
}
