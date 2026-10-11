import createGeoArc from './createGeoArc';

describe('createGeoArc', () => {
  it('進行方向の左（東向きなら北）に膨らむ', () => {
    const arc = createGeoArc({ lat: 0, lng: 0 }, { lat: 0, lng: 10 });
    const { lat, lng } = arc[32];
    expect(lng).toBeCloseTo(5, 10);
    expect(lat).toBeGreaterThan(0);
  });

  it('メルカトル座標で弧の高さを求める', () => {
    const arc = createGeoArc(
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { segmentCount: 2 },
    );
    // 高さは距離（経度 10° 分）の 0.2 倍 = 経度 2° 分のメルカトル座標の y
    const y = (2 * Math.PI) / 180;
    expect(arc[1].lat).toBeCloseTo(
      ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI,
      10,
    );
  });

  it('両端は渡した点をそのまま入れ、途中の点は from のプロパティを引き継ぐ', () => {
    const from = { lat: 0, lng: 0, id: 'from' },
      to = { lat: 0, lng: 10, id: 'to' };
    const arc = createGeoArc(from, to);
    expect(arc[0]).toBe(from);
    expect(arc[64]).toBe(to);
    expect(arc[1].id).toBe('from');
  });

  it('[lng, lat] の点を扱える', () => {
    const arc = createGeoArc([0, 0], [10, 0], { segmentCount: 2 });
    expect(arc[1][0]).toBeCloseTo(5, 10);
    expect(arc[1][1]).toBeGreaterThan(0);
  });

  it('経度 ±180° をまたぐ場合は近い方向に取り、連続した経度にする', () => {
    const arc = createGeoArc(
      { lat: 0, lng: 179 },
      { lat: 0, lng: -179 },
      { segmentCount: 2 },
    );
    expect(arc[1].lng).toBeCloseTo(180, 10);
  });
});
