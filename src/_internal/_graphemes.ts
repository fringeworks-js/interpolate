let segmenter: Intl.Segmenter | undefined;

/**
 * 文字列を書記素単位に分割する
 *
 * `Intl.Segmenter` に対応していない環境（Firefox 125 未満）ではコードポイント単位で分割する。
 * 対応ブラウザーが揃った時点でフォールバックを削除できるようにしている
 */
export default function _splitGraphemes(str: string): string[] {
  if (typeof Intl.Segmenter !== 'function') {
    return Array.from(str);
  }
  segmenter ??= new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment);
}
