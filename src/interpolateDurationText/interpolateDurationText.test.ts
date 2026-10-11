import interpolateDurationText from './interpolateDurationText';

describe('interpolateDurationText', () => {
  describe('mm:ss', () => {
    const i = interpolateDurationText('05:00', '00:00');

    it('秒数に直して補間する', () => {
      expect(i(0.5)).toBe('02:30');
      expect(i(0.9)).toBe('00:30');
    });

    it('端では a と b をそのまま返す', () => {
      expect(i(0)).toBe('05:00');
      expect(i(1)).toBe('00:00');
      expect(i(-1)).toBe('05:00');
      expect(i(2)).toBe('00:00');
    });

    it('既定では最小の単位に四捨五入する', () => {
      expect(i(0.001)).toBe('05:00');
      expect(i(0.002)).toBe('04:59');
    });

    it('繰り上がり・繰り下がりが自然につながる', () => {
      const j = interpolateDurationText('00:59', '01:01');
      expect(j(0.5)).toBe('01:00');
    });
  });

  it('h:mm:ss', () => {
    const i = interpolateDurationText('0:00:00', '1:30:00');
    expect(i(0.5)).toBe('0:45:00');
    expect(i(0.9)).toBe('1:21:00');
  });

  it('秒だけ', () => {
    expect(interpolateDurationText('0', '60')(0.5)).toBe('30');
  });

  it('小数の秒', () => {
    const i = interpolateDurationText('00:00.00', '00:09.58');
    expect(i(0.5)).toBe('00:04.79');
    expect(i(0.1)).toBe('00:00.96');
  });

  it('最初の部分は 60 や 24 を超えてもそのまま表示する', () => {
    expect(interpolateDurationText('00:00', '120:00')(0.5)).toBe('60:00');
    expect(interpolateDurationText('0:00:00', '30:00:00')(0.5)).toBe(
      '15:00:00',
    );
  });

  it('時刻も扱える', () => {
    expect(interpolateDurationText('09:00', '17:30')(0.5)).toBe('13:15');
  });

  describe('形式', () => {
    it('途中の文字列は b の形式に合わせる', () => {
      expect(interpolateDurationText('05:00', '10:00')(0.5)).toBe('07:30');
      expect(interpolateDurationText('300', '00:00')(0.5)).toBe('02:30');
      expect(interpolateDurationText('00:00', '0:10:00')(0.5)).toBe('0:05:00');
    });

    it('最初の部分は a と b の少ない方の桁数でゼロ埋めする', () => {
      expect(interpolateDurationText('5:00', '10:00')(0.5)).toBe('7:30');
      expect(interpolateDurationText('10:00', '5:00')(0.5)).toBe('7:30');
    });

    it('b の最小の単位に丸める', () => {
      expect(interpolateDurationText('00:00.5', '00:01')(0.5)).toBe('00:01');
    });
  });

  describe('rounding', () => {
    it('ceil にするとカウントダウンが 0 になる直前まで 1 秒を表示する', () => {
      const i = interpolateDurationText('00:10', '00:00', {
        rounding: 'ceil',
      });
      expect(i(0.99)).toBe('00:01');
      expect(i(0.01)).toBe('00:10');
    });

    it('floor', () => {
      const i = interpolateDurationText('00:00', '00:10', {
        rounding: 'floor',
      });
      expect(i(0.19)).toBe('00:01');
    });
  });

  it('読み取れない文字列はエラーにする', () => {
    expect(() => interpolateDurationText('abc', '00:00')).toThrow(TypeError);
    expect(() => interpolateDurationText('00:00', '1:2:3:4')).toThrow(
      TypeError,
    );
    expect(() => interpolateDurationText('-1:00', '00:00')).toThrow(TypeError);
  });
});
