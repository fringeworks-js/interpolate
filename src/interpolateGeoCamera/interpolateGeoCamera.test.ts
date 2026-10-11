import interpolateGeoCamera from './interpolateGeoCamera';

const tokyo = { lat: 35.68, lng: 139.77 },
  newYork = { lat: 40.71, lng: -74.0 };

describe('interpolateGeoCamera', () => {
  describe('端', () => {
    const a = { center: tokyo, zoom: 12 },
      b = { center: newYork, zoom: 10 };
    const i = interpolateGeoCamera(a, b);

    it('t=0 / t=1 では a / b と同じ値を新しいオブジェクトで返す', () => {
      expect(i(0)).toEqual(a);
      expect(i(0)).not.toBe(a);
      expect(i(0).center).toBe(tokyo);
      expect(i(1)).toEqual(b);
      expect(i(1).center).toBe(newYork);
    });

    it('範囲外の t は端の値で止める', () => {
      expect(i(-1)).toEqual(a);
      expect(i(2)).toEqual(b);
    });
  });

  it('中心が同じ場合はズームだけを変える', () => {
    const i = interpolateGeoCamera(
      { center: tokyo, zoom: 10 },
      { center: tokyo, zoom: 12 },
    );
    const { center, zoom } = i(0.5);
    expect(zoom).toBeCloseTo(11, 10);
    expect(center.lat).toBeCloseTo(tokyo.lat, 10);
    expect(center.lng).toBeCloseTo(tokyo.lng, 10);
  });

  describe('遠い場所への移動', () => {
    const i = interpolateGeoCamera(
      { center: { lat: 0, lng: 0 }, zoom: 10 },
      { center: { lat: 0, lng: 10 }, zoom: 10 },
    );

    it('途中でズームアウトする', () => {
      expect(i(0.5).zoom).toBeLessThan(10);
    });

    it('ズームが同じなら動きは対称になる', () => {
      expect(i(0.25).zoom).toBeCloseTo(i(0.75).zoom, 10);
      expect(i(0.5).center.lng).toBeCloseTo(5, 10);
      expect(i(0.5).center.lat).toBeCloseTo(0, 10);
    });

    it('viewportWidth が大きいほどズームアウトが小さい', () => {
      const wide = interpolateGeoCamera(
        { center: { lat: 0, lng: 0 }, zoom: 10 },
        { center: { lat: 0, lng: 10 }, zoom: 10 },
        { viewportWidth: 4000 },
      );
      expect(wide(0.5).zoom).toBeGreaterThan(i(0.5).zoom);
    });

    it('curve が大きいほどズームアウトが大きい', () => {
      const curved = interpolateGeoCamera(
        { center: { lat: 0, lng: 0 }, zoom: 10 },
        { center: { lat: 0, lng: 10 }, zoom: 10 },
        { curve: 2 },
      );
      expect(curved(0.5).zoom).toBeLessThan(i(0.5).zoom);
    });
  });

  it('経度 ±180° をまたぐ移動は近い方向に移動し、連続した経度を返す', () => {
    const i = interpolateGeoCamera(
      { center: { lat: 0, lng: 179 }, zoom: 8 },
      { center: { lat: 0, lng: -179 }, zoom: 8 },
    );
    expect(i(0.5).center.lng).toBeCloseTo(180, 10);
  });

  it('[lng, lat] の中心を扱える', () => {
    const i = interpolateGeoCamera(
      { center: [0, 0] as [number, number], zoom: 10 },
      { center: [10, 0] as [number, number], zoom: 10 },
    );
    const [lng, lat] = i(0.5).center;
    expect(lng).toBeCloseTo(5, 10);
    expect(lat).toBeCloseTo(0, 10);
  });

  describe('duration', () => {
    it('遠いほど長い', () => {
      const near = interpolateGeoCamera(
        { center: { lat: 0, lng: 0 }, zoom: 10 },
        { center: { lat: 0, lng: 0.1 }, zoom: 10 },
      );
      const far = interpolateGeoCamera(
        { center: { lat: 0, lng: 0 }, zoom: 10 },
        { center: { lat: 0, lng: 10 }, zoom: 10 },
      );
      expect(near.duration).toBeGreaterThan(0);
      expect(far.duration).toBeGreaterThan(near.duration);
    });

    it('移動しない場合は 0', () => {
      const i = interpolateGeoCamera(
        { center: tokyo, zoom: 10 },
        { center: tokyo, zoom: 10 },
      );
      expect(i.duration).toBe(0);
    });

    it('ズームインでも正の値', () => {
      const i = interpolateGeoCamera(
        { center: tokyo, zoom: 12 },
        { center: tokyo, zoom: 10 },
      );
      expect(i.duration).toBeGreaterThan(0);
    });
  });

  describe('heading / tilt', () => {
    it('両方にある場合は補間する（heading は近い方向に回る）', () => {
      const i = interpolateGeoCamera(
        { center: tokyo, zoom: 10, heading: 350, tilt: 0 },
        { center: tokyo, zoom: 10, heading: 10, tilt: 45 },
      );
      const { heading, tilt } = i(0.5);
      expect(heading).toBeCloseTo(360, 10);
      expect(tilt).toBeCloseTo(22.5, 10);
    });

    it('片方にしかない場合は補間しない', () => {
      const i = interpolateGeoCamera(
        { center: tokyo, zoom: 10, heading: 90 },
        { center: tokyo, zoom: 12 },
      );
      expect(i(0.5)).not.toHaveProperty('heading');
      expect(i(0.5)).not.toHaveProperty('tilt');
    });
  });

  it('中心の点は補間前の点のプロパティを引き継ぐ', () => {
    const i = interpolateGeoCamera(
      { center: { lat: 0, lng: 0, id: 'a' }, zoom: 10 },
      { center: { lat: 0, lng: 10, id: 'b' }, zoom: 10 },
    );
    expect(i(0.5).center.id).toBe('a');
  });

  it('不正なオプションは既定値にする', () => {
    const a = { center: { lat: 0, lng: 0 }, zoom: 10 },
      b = { center: { lat: 0, lng: 10 }, zoom: 10 };
    const expected = interpolateGeoCamera(a, b)(0.5);
    for (const value of [0, -1, NaN, Infinity]) {
      expect(interpolateGeoCamera(a, b, { viewportWidth: value })(0.5)).toEqual(
        expected,
      );
      expect(interpolateGeoCamera(a, b, { curve: value })(0.5)).toEqual(
        expected,
      );
    }
  });
});
