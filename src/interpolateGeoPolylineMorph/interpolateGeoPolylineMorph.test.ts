import interpolateGeoPolylineMorph from './interpolateGeoPolylineMorph';

describe('interpolateGeoPolylineMorph', () => {
  it('メルカトル座標で補間する', () => {
    const i = interpolateGeoPolylineMorph(
      [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
      ],
      [
        { lat: 60, lng: 0 },
        { lat: 60, lng: 10 },
      ],
    );
    const [p0, p1] = i(0.5);
    expect(p0!.lat).toBeCloseTo(35.26438968, 6);
    expect(p0!.lng).toBeCloseTo(0, 10);
    expect(p1!.lng).toBeCloseTo(10, 10);
  });

  it('[lng, lat] の点を扱える', () => {
    const i = interpolateGeoPolylineMorph(
      [
        [0, 0],
        [10, 0],
      ],
      [
        [0, 0],
        [20, 0],
      ],
    );
    expect(i(0.5)[1]![0]!).toBeCloseTo(15, 10);
  });

  it('経度 ±180° をまたぐ場合は近い方向に取り、元の点から連続した経度で返す', () => {
    const i = interpolateGeoPolylineMorph(
      [
        { lat: 0, lng: 170 },
        { lat: 0, lng: 179 },
      ],
      [
        { lat: 0, lng: 170 },
        { lat: 0, lng: -171 },
      ],
    );
    expect(i(0.4)[1]!.lng).toBeCloseTo(183, 10);
    // b 側の頂点を基準にした経度
    expect(i(0.6)[1]!.lng).toBeCloseTo(-175, 10);
  });

  it('t=0 / t=1 では a / b の点を返す', () => {
    const a = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
      ],
      b = [
        { lat: 1, lng: 0 },
        { lat: 1, lng: 10 },
      ];
    const i = interpolateGeoPolylineMorph(a, b);
    expect(i(0)[1]!).toBe(a[1]!);
    expect(i(1)[1]!).toBe(b[1]!);
  });

  describe('点のない折れ線', () => {
    const route = [
      { lat: 0, lng: 179 },
      { lat: 0, lng: -179 },
    ];

    it("origin: 'center' は経度 ±180° をまたいでも線の上の中央を基準にする", () => {
      const i = interpolateGeoPolylineMorph([], route, { origin: 'center' });
      const [p0, p1] = i(0.5);
      expect(p0!.lng).toBeCloseTo(179.5, 10);
      expect(p1!.lng).toBeCloseTo(-179.5, 10);
    });

    it('origin に指定した点も近い方向に取る', () => {
      const i = interpolateGeoPolylineMorph(route, [], {
        origin: { lat: 0, lng: -180 },
      });
      const [p0, p1] = i(0.5);
      expect(p0!.lng).toBeCloseTo(179.5, 10);
      expect(p1!.lng).toBeCloseTo(-179.5, 10);
    });
  });
});
