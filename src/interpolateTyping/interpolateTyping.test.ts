import interpolateTyping from './interpolateTyping';

describe('interpolateTyping', () => {
  describe('空の文字列から打つ', () => {
    const i = interpolateTyping('', 'hello');

    it('t=0 のとき空文字を返す', () => {
      expect(i(0)).toBe('');
    });

    it('t=1 のとき全文字を返す', () => {
      expect(i(1)).toBe('hello');
    });

    it('t に応じた長さの文字列を返す（切り捨て）', () => {
      expect(i(0.4)).toBe('he');
      expect(i(0.5)).toBe('he');
      expect(i(0.6)).toBe('hel');
    });
  });

  describe('空の文字列まで消す', () => {
    const i = interpolateTyping('hello', '');

    it('t=0 のとき全文字を返す', () => {
      expect(i(0)).toBe('hello');
    });

    it('t=1 のとき空文字を返す', () => {
      expect(i(1)).toBe('');
    });

    it('t に応じて末尾から消す', () => {
      expect(i(0.4)).toBe('hel');
      expect(i(0.8)).toBe('h');
    });
  });

  describe('打ち替える', () => {
    const i = interpolateTyping('hello', 'world');

    it('t=0 のとき a を返す', () => {
      expect(i(0)).toBe('hello');
    });

    it('t=1 のとき b を返す', () => {
      expect(i(1)).toBe('world');
    });

    it('前半で a を末尾から消す', () => {
      expect(i(0.25)).toBe('he');
    });

    it('t=0.5 のとき空文字を返す', () => {
      expect(i(0.5)).toBe('');
    });

    it('後半で b を打つ', () => {
      expect(i(0.75)).toBe('wo');
    });
  });

  describe('eraseRatio', () => {
    it('全体のうち消す時間の割合を指定できる', () => {
      const i = interpolateTyping('hello', 'world', { eraseRatio: 0.2 });
      expect(i(0.1)).toBe('he');
      expect(i(0.2)).toBe('');
      expect(i(0.6)).toBe('wo');
    });

    it('0 のとき一瞬で消して打ち始める', () => {
      const i = interpolateTyping('hello', 'world', { eraseRatio: 0 });
      expect(i(0)).toBe('hello');
      expect(i(0.01)).toBe('');
      expect(i(0.5)).toBe('wo');
    });

    it('1 のとき最後まで消し続ける', () => {
      const i = interpolateTyping('hello', 'world', { eraseRatio: 1 });
      expect(i(0.5)).toBe('he');
      expect(i(0.99)).toBe('');
      expect(i(1)).toBe('world');
    });

    it('片方が空の場合は全体の時間を使う', () => {
      expect(interpolateTyping('', 'hello', { eraseRatio: 0.2 })(0.5)).toBe(
        'he',
      );
      expect(interpolateTyping('hello', '', { eraseRatio: 0.2 })(0.4)).toBe(
        'hel',
      );
    });

    it('0 〜 1 の範囲外は 0 〜 1 に収め、NaN は既定値にする', () => {
      expect(
        interpolateTyping('hello', 'world', { eraseRatio: -0.1 })(0.5),
      ).toBe(interpolateTyping('hello', 'world', { eraseRatio: 0 })(0.5));
      expect(
        interpolateTyping('hello', 'world', { eraseRatio: 1.1 })(0.5),
      ).toBe(interpolateTyping('hello', 'world', { eraseRatio: 1 })(0.5));
      expect(
        interpolateTyping('hello', 'world', { eraseRatio: NaN })(0.25),
      ).toBe('he');
    });
  });

  describe('keepCommonPrefix', () => {
    it('共通する先頭部分を残し、違う部分だけを消して打つ', () => {
      const i = interpolateTyping('Hello', 'Help', { keepCommonPrefix: true });
      expect(i(0)).toBe('Hello');
      expect(i(0.25)).toBe('Hell');
      expect(i(0.5)).toBe('Hel');
      expect(i(0.75)).toBe('Hel');
      expect(i(0.99)).toBe('Hel');
      expect(i(1)).toBe('Help');
    });

    it('eraseRatio と組み合わせる', () => {
      const i = interpolateTyping('Hello', 'Helium', {
        keepCommonPrefix: true,
        eraseRatio: 0.2,
      });
      // "lo" を 0 〜 0.2 で消し、"ium" を 0.2 〜 1 で打つ
      expect(i(0.1)).toBe('Hell');
      expect(i(0.6)).toBe('Heli');
    });

    it('消す部分がない場合は全体の時間で打つ', () => {
      const i = interpolateTyping('Hel', 'Hello', { keepCommonPrefix: true });
      expect(i(0.5)).toBe('Hell');
    });

    it('打つ部分がない場合は全体の時間で消す', () => {
      const i = interpolateTyping('Hello', 'Hel', { keepCommonPrefix: true });
      expect(i(0.5)).toBe('Hell');
    });

    it('同じ文字列の場合は変化しない', () => {
      const i = interpolateTyping('Hello', 'Hello', { keepCommonPrefix: true });
      expect(i(0.5)).toBe('Hello');
    });

    it('共通部分は書記素単位で求める', () => {
      // 「か」と「が（か + 結合文字の濁点）」は別の文字として扱う
      const i = interpolateTyping('あか', 'あが', {
        keepCommonPrefix: true,
      });
      expect(i(0.25)).toBe('あ');
      expect(i(0.75)).toBe('あ');
    });

    it('既定では全て消してから打つ', () => {
      expect(interpolateTyping('Hello', 'Help')(0.5)).toBe('');
    });
  });

  describe('範囲外の t', () => {
    const i = interpolateTyping('hello', 'world');

    it('0 未満のとき a を返す', () => {
      expect(i(-1)).toBe('hello');
    });

    it('1 より大きいとき b を返す', () => {
      expect(i(2)).toBe('world');
    });
  });

  describe('書記素', () => {
    it('サロゲートペアを分割しない', () => {
      expect(interpolateTyping('', '𩸽𩸽')(0.5)).toBe('𩸽');
    });

    it('ZWJ で結合した絵文字を分割しない', () => {
      expect(interpolateTyping('', '👨‍👩‍👧👍')(0.5)).toBe('👨‍👩‍👧');
    });

    it('結合文字を分割しない', () => {
      expect(interpolateTyping('', 'がき')(0.5)).toBe('が');
    });

    describe('Intl.Segmenter に対応していない環境', () => {
      const { Segmenter } = Intl;
      beforeEach(() => {
        (Intl as any).Segmenter = undefined;
      });
      afterEach(() => {
        (Intl as any).Segmenter = Segmenter;
      });

      it('コードポイント単位で分割する', () => {
        expect(interpolateTyping('', '𩸽𩸽')(0.5)).toBe('𩸽');
        expect(interpolateTyping('', 'がき')(0.5)).toBe('か');
      });
    });
  });
});
