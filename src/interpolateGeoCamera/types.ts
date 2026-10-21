import type { Coordinates, Interpolator } from '../_internal/_types';

export type { Coordinates, Interpolator } from '../_internal/_types';

/**
 * 地図のカメラ（Google Maps の `CameraOptions` と同じ形）
 */
export type GeoCamera<P> = {
  /**
   * 中心の位置
   */
  center: P;
  /**
   * ズームレベル
   */
  zoom: number;
  /**
   * 方位（度）。補間前と補間後の片方にしかない場合は、途中もその値にする
   */
  heading?: number;
  /**
   * 傾き（度）。補間前と補間後の片方にしかない場合は、途中もその値にする
   */
  tilt?: number;
};

/**
 * カメラの中心の点を作るときに渡す情報
 */
export type CameraPointContext<P> = {
  /**
   * 補間前のカメラの中心の点
   */
  source: P;
};

/**
 * `interpolateGeoCamera` のオプション
 */
export type InterpolateGeoCameraOptions<P> = {
  /**
   * 地図の幅（px）。移動距離と画面の幅の比で、どれだけズームアウトするかが決まる。0 以下・有限でない数の場合は 1000 にする。デフォルトは 1000
   */
  viewportWidth?: number;
  /**
   * 曲がり具合（d3 の `interpolateZoom` の `rho`）。大きいほど大きくズームアウトする。0 以下・有限でない数の場合は √2 にする。デフォルトは √2
   */
  curve?: number;
  /**
   * 点から座標（`[lng, lat]`）を取り出す関数
   */
  getCoordinates?: (point: P) => Coordinates;
  /**
   * 座標（`[lng, lat]`）から点を作る関数
   */
  createPoint?: (coordinates: Coordinates, context: CameraPointContext<P>) => P;
};

/**
 * `interpolateGeoCamera` が返す関数
 */
export type GeoCameraInterpolator<P> = Interpolator<GeoCamera<P>> & {
  /**
   * 移動量に見合った時間（ミリ秒）。d3 の `interpolateZoom` の `duration` と同じ
   */
  duration: number;
};
