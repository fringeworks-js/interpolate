import _splitGraphemes from '../_internal/_graphemes';
import { _nonNegativeOr } from '../_internal/_numbers';
import _createStaggerRanges, { _toLocal } from '../_internal/_stagger';
import type { InterpolateScrambleOptions } from './types';

const DEFAULT_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 3つの整数から、0 以上 2^32 未満の疑似乱数を求める
 */
const hash = (seed: number, position: number, step: number): number => {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ position ^ (h >>> 13), 0xc2b2ae35);
  h = Math.imul(h ^ step ^ (h >>> 16), 0x27d4eb2f);
  return (h ^ (h >>> 15)) >>> 0;
};

/**
 * 文字列を、ランダムな文字を経て別の文字列に変える関数を返す
 *
 * 文字ごとに区間をずらし、区間の前は `a` の文字、区間の中はランダムな文字、区間の後は `b` の文字にする。
 * 空白はランダムな文字にしない。
 * 同じ t には必ず同じ文字列を返す（ランダムな文字は、位置と t から求めた疑似乱数で決める）
 * @param a 補間前の文字列（t = 0 のときの値）
 * @param b 補間後の文字列（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた文字列を返す関数
 */
export default function interpolateScramble(
  a: string,
  b: string,
  options: InterpolateScrambleOptions = {},
): (t: number) => string {
  const { seed = 0 } = options;
  // 空の characters や、負の数・有限でない数は既定値にする
  const pool = _splitGraphemes(options.characters || DEFAULT_CHARACTERS);
  const changeCount = _nonNegativeOr(options.changeCount, 60);

  const from = _splitGraphemes(a),
    to = _splitGraphemes(b);
  const count = Math.max(from.length, to.length);
  const ranges = _createStaggerRanges(count, options.stagger, 0.2);

  return (t) => {
    if (t <= 0) {
      return a;
    } else if (t >= 1) {
      return b;
    }
    const step = Math.floor(t * changeCount);
    let result = '';
    for (let i = 0; i < count; i++) {
      const local = _toLocal(t, ranges[i]);
      if (local <= 0) {
        result += from[i] ?? '';
      } else if (local >= 1) {
        result += to[i] ?? '';
      } else {
        const target = to[i] ?? from[i];
        result += /^\s+$/.test(target)
          ? target
          : pool[hash(seed, i, step) % pool.length];
      }
    }
    return result;
  };
}
