import interpolateScramble from './interpolateScramble';

describe('interpolateScramble', () => {
  it('端では a と b をそのまま返す', () => {
    const i = interpolateScramble('Loading', 'Complete');
    expect(i(0)).toBe('Loading');
    expect(i(1)).toBe('Complete');
    expect(i(-1)).toBe('Loading');
    expect(i(2)).toBe('Complete');
  });

  it('同じ t には同じ文字列を返す', () => {
    const i = interpolateScramble('', 'ACCESS GRANTED');
    expect(i(0.4)).toBe(i(0.4));
    expect(interpolateScramble('', 'ACCESS GRANTED')(0.4)).toBe(i(0.4));
  });

  it('seed で並びが変わる', () => {
    const results = new Set(
      [0, 1, 2, 3, 4].map((seed) =>
        interpolateScramble('', 'ABCDEFGHIJ', { stagger: 0, seed })(0.5),
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  describe('文字ごとのタイミング', () => {
    it('左から順に確定する', () => {
      // stagger: 1 では1文字ずつ順番になる（1文字あたり 0.2）
      const i = interpolateScramble('', 'ABCDE', { stagger: 1 });
      const result = i(0.5);
      expect(result).toHaveLength(3);
      expect(result.startsWith('AB')).toBe(true);
    });

    it('始まる前は a の文字を表示する', () => {
      const i = interpolateScramble('abcde', 'ABCDE', { stagger: 1 });
      expect(i(0.5).slice(3)).toBe('de');
    });

    it('a の方が長い場合は、確定した位置から消える', () => {
      const i = interpolateScramble('Hello', 'Hi', { stagger: 1 });
      const result = i(0.9);
      expect(result).toHaveLength(3);
      expect(result.startsWith('Hi')).toBe(true);
    });

    it('stagger: 0 では全ての文字が同時に変わる', () => {
      const result = interpolateScramble('', 'ABCDE', { stagger: 0 })(0.5);
      expect(result).toHaveLength(5);
      expect(result).toMatch(/^[A-Za-z0-9]{5}$/);
    });
  });

  it('空白はランダムな文字にしない', () => {
    const result = interpolateScramble('', 'AB CD', { stagger: 0 })(0.5);
    expect(result[2]).toBe(' ');
  });

  describe('characters', () => {
    it('ランダムに使う文字を指定できる', () => {
      const result = interpolateScramble('', 'ABCDEFGHIJ', {
        stagger: 0,
        characters: '01',
      })(0.5);
      expect(result).toMatch(/^[01]{10}$/);
    });

    it('書記素単位で扱う', () => {
      const result = interpolateScramble('', 'ABC', {
        stagger: 0,
        characters: '👨‍👩‍👧🍎',
      })(0.5);
      expect(result).toMatch(/^(👨‍👩‍👧|🍎){3}$/u);
    });
  });

  describe('changeCount', () => {
    it('0 のときランダムな文字は変わらない', () => {
      const i = interpolateScramble('', 'ABCDEFGHIJ', {
        stagger: 0,
        changeCount: 0,
      });
      expect(i(0.3)).toBe(i(0.7));
    });

    it('指定した回数だけ入れ替わる', () => {
      const i = interpolateScramble('', 'ABCDEFGHIJ', {
        stagger: 0,
        changeCount: 4,
      });
      // 0.25 刻みの区間の中では変わらない
      expect(i(0.3)).toBe(i(0.45));
      expect(i(0.3)).not.toBe(i(0.55));
    });
  });

  it('不正なオプションは既定値にする', () => {
    const expected = interpolateScramble('', 'ABCDEFGHIJ')(0.5);
    expect(interpolateScramble('', 'ABCDEFGHIJ', { characters: '' })(0.5)).toBe(
      expected,
    );
    expect(
      interpolateScramble('', 'ABCDEFGHIJ', { changeCount: -1 })(0.5),
    ).toBe(expected);
    expect(interpolateScramble('', 'ABCDEFGHIJ', { stagger: NaN })(0.5)).toBe(
      expected,
    );
  });
});
