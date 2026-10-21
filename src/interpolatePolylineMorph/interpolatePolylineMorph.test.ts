import interpolatePolylineMorph from './interpolatePolylineMorph';

type Point = [number, number];

describe('interpolatePolylineMorph', () => {
  it('対応する点どうしを補間する', () => {
    const i = interpolatePolylineMorph<Point>(
      [
        [0, 0],
        [10, 0],
      ],
      [
        [0, 10],
        [10, 10],
      ],
    );
    expect(i(0.5)).toEqual([
      [0, 5],
      [10, 5],
    ]);
  });

  it('点の数が違う場合は、両方の頂点の位置で打ち直す', () => {
    const i = interpolatePolylineMorph<Point>(
      [
        [0, 0],
        [5, 0],
        [10, 0],
      ],
      [
        [0, 10],
        [10, 20],
      ],
    );
    expect(i(0.5)).toEqual([
      [0, 5],
      [5, 7.5],
      [10, 10],
    ]);
  });

  it('角の位置は途中で丸まらない', () => {
    // a は 1/4、b は 3/4 の位置に角がある
    const i = interpolatePolylineMorph<Point>(
      [
        [0, 0],
        [0, 10],
        [30, 10],
      ],
      [
        [0, 0],
        [30, 0],
        [30, 10],
      ],
    );
    const result = i(0);
    expect(result).toHaveLength(3);
    const middle = i(0.5);
    expect(middle).toHaveLength(4);
    expect(middle[1]).toEqual([5, 5]);
    expect(middle[2]).toEqual([25, 5]);
  });

  describe('端', () => {
    const a: Point[] = [
        [0, 0],
        [10, 0],
      ],
      b: Point[] = [
        [0, 10],
        [5, 10],
        [10, 10],
      ];
    const i = interpolatePolylineMorph(a, b);

    it('t=0 / t=1 では a / b の点を新しい配列で返す', () => {
      expect(i(0)).toEqual(a);
      expect(i(0)).not.toBe(a);
      expect(i(0)[0]).toBe(a[0]);
      expect(i(1)).toEqual(b);
      expect(i(1)[2]).toBe(b[2]);
    });

    it('既定では範囲外の t は端の値で止める', () => {
      expect(i(-1)).toEqual(a);
      expect(i(2)).toEqual(b);
    });

    it('extrapolateStart / extrapolateEnd で外挿する', () => {
      const j = interpolatePolylineMorph(a, b, {
        extrapolateStart: true,
        extrapolateEnd: true,
      });
      expect(j(-1)[0]).toEqual([0, -10]);
      expect(j(2)[0]).toEqual([0, 20]);
    });
  });

  it('{ x, y } の点は、t < 0.5 なら a 側、それ以外は b 側の直前の頂点のプロパティを引き継ぐ', () => {
    const i = interpolatePolylineMorph(
      [
        { x: 0, y: 0, side: 'a' },
        { x: 10, y: 0, side: 'a' },
      ],
      [
        { x: 0, y: 10, side: 'b' },
        { x: 10, y: 10, side: 'b' },
      ],
    );
    expect(i(0.4)[0]).toEqual({ x: 0, y: 4, side: 'a' });
    expect(i(0.6)[0]).toEqual({ x: 0, y: 6, side: 'b' });
  });

  it('createPoint に両側の頂点と t を渡す', () => {
    const createPoint = vi.fn((coordinates: Point) => coordinates);
    const a: Point[] = [
        [0, 0],
        [10, 0],
      ],
      b: Point[] = [
        [0, 10],
        [10, 10],
      ];
    interpolatePolylineMorph(a, b, { createPoint })(0.3);
    expect(createPoint).toHaveBeenCalledWith([0, 3], {
      from: a[0],
      to: b[0],
      t: 0.3,
    });
    expect(createPoint).toHaveBeenCalledWith([10, 3], {
      from: a[1],
      to: b[1],
      t: 0.3,
    });
  });

  describe('点のない折れ線', () => {
    const route: Point[] = [
      [0, 0],
      [10, 0],
      [10, 10],
    ];

    it('既定では、点のある側の始点から広がる', () => {
      const i = interpolatePolylineMorph<Point>([], route);
      expect(i(0)).toEqual([]);
      expect(i(0.5)).toEqual([
        [0, 0],
        [5, 0],
        [5, 5],
      ]);
      expect(i(1)).toEqual(route);
    });

    it('既定では、点のある側の始点へ縮む', () => {
      const i = interpolatePolylineMorph<Point>(route, []);
      expect(i(0)).toEqual(route);
      expect(i(0.5)).toEqual([
        [0, 0],
        [5, 0],
        [5, 5],
      ]);
      expect(i(1)).toEqual([]);
    });

    it("origin: 'end' は終点を基準にする", () => {
      const i = interpolatePolylineMorph<Point>([], route, { origin: 'end' });
      expect(i(0.5)).toEqual([
        [5, 5],
        [10, 5],
        [10, 10],
      ]);
    });

    it("origin: 'middle' は全体の長さの半分の位置を基準にする", () => {
      const i = interpolatePolylineMorph<Point>([], route, {
        origin: 'middle',
      });
      expect(i(0.5)).toEqual([
        [5, 0],
        [10, 0],
        [10, 5],
      ]);
    });

    it('origin に点を指定できる', () => {
      const i = interpolatePolylineMorph<Point>([], route, {
        origin: [0, 10],
      });
      expect(i(0.5)[0]).toEqual([0, 5]);
    });

    it('点は点のある側の頂点のプロパティを引き継ぐ', () => {
      const i = interpolatePolylineMorph(
        [],
        [
          { x: 0, y: 0, id: 'p0' },
          { x: 10, y: 0, id: 'p1' },
        ],
      );
      expect(i(0.2)).toEqual([
        { x: 0, y: 0, id: 'p0' },
        { x: 2, y: 0, id: 'p1' },
      ]);
    });

    it('createPoint の from / to には点のある側の頂点を入れる', () => {
      const createPoint = vi.fn((coordinates: Point) => coordinates);
      interpolatePolylineMorph(route, [], { createPoint })(0.5);
      expect(createPoint).toHaveBeenCalledWith([5, 0], {
        from: route[1],
        to: route[1],
        t: 0.5,
      });
    });
  });

  describe('長さのない折れ線', () => {
    it('1点の折れ線から広がる', () => {
      const i = interpolatePolylineMorph<Point>(
        [[5, 5]],
        [
          [0, 0],
          [10, 0],
        ],
      );
      expect(i(0.5)).toEqual([
        [2.5, 2.5],
        [7.5, 2.5],
      ]);
    });

    it('全ての点が同じ位置の折れ線から広がる', () => {
      const i = interpolatePolylineMorph<Point>(
        [
          [5, 5],
          [5, 5],
        ],
        [
          [0, 0],
          [10, 0],
        ],
      );
      expect(i(0.5)).toEqual([
        [2.5, 2.5],
        [7.5, 2.5],
      ]);
    });

    it('両方とも点がない場合は常に空の配列を返す', () => {
      const i = interpolatePolylineMorph([], []);
      expect(i(0)).toEqual([]);
      expect(i(0.5)).toEqual([]);
      expect(i(1)).toEqual([]);
    });
  });
});
