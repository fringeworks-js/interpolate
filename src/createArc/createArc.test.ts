import createArc from './createArc';

type Point = [number, number];

describe('createArc', () => {
  const from: Point = [0, 0],
    to: Point = [10, 0];

  it('既定では 64 本の線分の弧を作り、両端は渡した点をそのまま入れる', () => {
    const arc = createArc(from, to);
    expect(arc).toHaveLength(65);
    expect(arc[0]!).toBe(from);
    expect(arc[64]!).toBe(to);
  });

  it('弧の高さは2点間の距離の curvature 倍で、進行方向の左（画面の上）に膨らむ', () => {
    const [x, y] = createArc(from, to)[32]!;
    expect(x).toBeCloseTo(5, 10);
    expect(y).toBeCloseTo(-2, 10);
  });

  it('curvature が負の値なら右に膨らむ', () => {
    const [, y] = createArc(from, to, { curvature: -0.5 })[32]!;
    expect(y).toBeCloseTo(5, 10);
  });

  it('curvature が 0 なら直線になる', () => {
    expect(createArc(from, to, { curvature: 0, segmentCount: 2 })).toEqual([
      from,
      [5, 0],
      to,
    ]);
  });

  it('segmentCount で線分の数を指定できる', () => {
    expect(createArc(from, to, { segmentCount: 4 })).toHaveLength(5);
  });

  it('{ x, y } の途中の点は from のプロパティを引き継ぐ', () => {
    const arc = createArc(
      { x: 0, y: 0, id: 'from' },
      { x: 10, y: 0, id: 'to' },
      { segmentCount: 2 },
    );
    expect(arc[1]!).toEqual({ x: 5, y: -2, id: 'from' });
  });

  it('createPoint に両端と曲線上の位置を渡す', () => {
    const createPoint = vi.fn((coordinates: Point) => coordinates);
    createArc(from, to, { segmentCount: 4, createPoint });
    expect(createPoint).toHaveBeenCalledTimes(3);
    expect(createPoint).toHaveBeenCalledWith(expect.any(Array), {
      from,
      to,
      ratio: 0.25,
    });
  });

  it('curvature が有限でない数の場合は既定値にする', () => {
    expect(createArc(from, to, { curvature: NaN })).toEqual(
      createArc(from, to),
    );
  });

  it('segmentCount は四捨五入し、1 未満や有限でない数の場合は既定値にする', () => {
    expect(createArc(from, to, { segmentCount: 1.6 })).toHaveLength(3);
    expect(createArc(from, to, { segmentCount: 0.4 })).toHaveLength(65);
    expect(createArc(from, to, { segmentCount: -1 })).toHaveLength(65);
    expect(createArc(from, to, { segmentCount: NaN })).toHaveLength(65);
  });
});
