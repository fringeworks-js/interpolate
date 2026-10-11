import interpolateFormattedNumber from './interpolateFormattedNumber';

const en = new Intl.NumberFormat('en-US');

describe('interpolateFormattedNumber', () => {
  it('補間した数値を書式化する', () => {
    const i = interpolateFormattedNumber(1200, 12000, { formatter: en });
    expect(i(0)).toBe('1,200');
    expect(i(0.5)).toBe('6,600');
    expect(i(1)).toBe('12,000');
  });

  it('既定の formatter は実行環境のロケールの Intl.NumberFormat', () => {
    expect(interpolateFormattedNumber(0, 10000)(0.5)).toBe(
      new Intl.NumberFormat().format(5000),
    );
  });

  it('Intl.NumberFormat の書式（通貨など）を使える', () => {
    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    });
    const i = interpolateFormattedNumber(1200, 12000, { formatter });
    expect(i(0.5)).toBe(formatter.format(6600));
  });

  it('関数を formatter にできる', () => {
    const i = interpolateFormattedNumber(0, 100, {
      formatter: (value) => `${value}%`,
    });
    expect(i(0.25)).toBe('25%');
  });

  describe('小数の桁', () => {
    it('整数どうしなら途中も整数に丸める', () => {
      const i = interpolateFormattedNumber(0, 10, { formatter: String });
      expect(i(0.123)).toBe('1');
    });

    it('a と b の小数の桁数の多い方に丸める', () => {
      const i = interpolateFormattedNumber(1.5, 3.25, { formatter: String });
      expect(i(0.5)).toBe('2.38');
    });

    it('指数表記の小数も桁数を数える', () => {
      const i = interpolateFormattedNumber(0, 2e-7, { formatter: String });
      expect(i(0.5)).toBe('1e-7');
    });

    it('有限でない数は小数の桁数を 0 とする', () => {
      const i = interpolateFormattedNumber(1.5, Infinity, {
        formatter: String,
      });
      expect(i(0)).toBe('1.5');
      expect(i(1)).toBe('Infinity');
    });

    it('fractionDigits で上書きできる', () => {
      const i = interpolateFormattedNumber(0, 1, {
        formatter: String,
        fractionDigits: 1,
      });
      expect(i(0.33)).toBe('0.3');
    });
  });

  describe('rounding', () => {
    it('ceil にするとカウントダウンが 0 になる直前まで 1 を表示する', () => {
      const i = interpolateFormattedNumber(10, 0, {
        formatter: String,
        rounding: 'ceil',
      });
      expect(i(0.95)).toBe('1');
      expect(i(0.99)).toBe('1');
      expect(i(1)).toBe('0');
    });

    it('floor', () => {
      const i = interpolateFormattedNumber(0, 10, {
        formatter: String,
        rounding: 'floor',
      });
      expect(i(0.19)).toBe('1');
    });

    it('浮動小数点の誤差で丸めがずれない', () => {
      const i = interpolateFormattedNumber(0, 0.3, {
        formatter: String,
        rounding: 'floor',
      });
      // 0.3 * (1 / 3) * 10 は 0.9999999999999999 になる
      expect(i(1 / 3)).toBe('0.1');
    });

    it('-0 は 0 にする', () => {
      const i = interpolateFormattedNumber(1, -1, { formatter: en });
      expect(i(0.5)).toBe('0');
    });
  });

  it('範囲外の t は端の値で止める', () => {
    const i = interpolateFormattedNumber(0, 100, { formatter: String });
    expect(i(-1)).toBe('0');
    expect(i(2)).toBe('100');
  });

  it('fractionDigits の小数は四捨五入し、負の数や有限でない数は既定値にする', () => {
    const create = (fractionDigits: number) =>
      interpolateFormattedNumber(0, 1, { formatter: String, fractionDigits });
    expect(create(1.4)(0.33)).toBe('0.3');
    expect(create(-1)(0.33)).toBe('0');
    expect(create(NaN)(0.33)).toBe('0');
  });
});
