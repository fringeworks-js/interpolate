import _splitGraphemes from '../_internal/_graphemes';
import { _clampOr } from '../_internal/_numbers';
import type { InterpolateTypingOptions } from './types';

/**
 * 文字列をタイピングで打ち替えるように補間する関数を返す
 *
 * `a` が空の場合は `b` を先頭から打ち、`b` が空の場合は `a` を末尾から消す。
 * どちらもある場合は、`eraseRatio` の割合の時間で `a` を消し、残りの時間で `b` を打つ。
 * `keepCommonPrefix` を指定した場合は、共通する先頭部分を残し、違う部分だけを消して打つ。
 * 文字は書記素（見た目の1文字）単位で扱い、絵文字や結合文字を途中で分割しない
 * @param a 補間前の文字列（t = 0 のときの値）
 * @param b 補間後の文字列（t = 1 のときの値）
 * @param options オプション
 * @returns `t` に応じた文字列を返す関数
 */
export default function interpolateTyping(
  a: string,
  b: string,
  options: InterpolateTypingOptions = {},
): (t: number) => string {
  const { keepCommonPrefix = false } = options;
  // 範囲外は 0 〜 1 に収め、NaN は既定値にする
  const eraseRatio = _clampOr(options.eraseRatio ?? 0.5, 0, 1, 0.5);

  let from = _splitGraphemes(a),
    to = _splitGraphemes(b),
    prefix = '';
  if (keepCommonPrefix) {
    let count = 0;
    while (
      count < from.length &&
      count < to.length &&
      from[count] === to[count]
    ) {
      count++;
    }
    prefix = from.slice(0, count).join('');
    from = from.slice(count);
    to = to.slice(count);
  }

  return (t) => {
    if (t <= 0) {
      return a;
    } else if (t >= 1) {
      return b;
    }

    if (!from.length) {
      return prefix + type(to, t);
    } else if (!to.length) {
      return prefix + erase(from, t);
    }

    return (
      prefix +
      (t < eraseRatio
        ? erase(from, t / eraseRatio)
        : type(to, (t - eraseRatio) / (1 - eraseRatio)))
    );
  };
}

/**
 * 進み具合に応じて、先頭から打った文字列を返す
 */
function type(chars: readonly string[], progress: number): string {
  return chars.slice(0, Math.floor(chars.length * progress)).join('');
}

/**
 * 進み具合に応じて、末尾から消した文字列を返す
 *
 * `1 - progress` は浮動小数点の誤差で1文字ずれることがあるため、消した文字数から求める
 */
function erase(chars: readonly string[], progress: number): string {
  return chars
    .slice(0, chars.length - Math.ceil(chars.length * progress))
    .join('');
}
