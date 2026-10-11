import interpolateTyping from '../interpolateTyping/interpolateTyping';
import reverseInterpolator from './reverseInterpolator';

describe('reverseInterpolator', () => {
  it('逆向きに再生する', () => {
    const i = reverseInterpolator((t: number) => t);
    expect(i(0)).toBe(1);
    expect(i(0.25)).toBe(0.75);
    expect(i(1)).toBe(0);
  });

  it('範囲外の t もそのまま反転して渡す', () => {
    const i = reverseInterpolator((t: number) => t);
    expect(i(-0.5)).toBe(1.5);
    expect(i(1.5)).toBe(-0.5);
  });

  it('打った文字列を消す', () => {
    const i = reverseInterpolator(interpolateTyping('', 'Hello'));
    expect(i(0)).toBe('Hello');
    expect(i(0.4)).toBe('Hel');
    expect(i(1)).toBe('');
  });
});
