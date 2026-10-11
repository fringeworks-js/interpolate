/**
 * 座標（平面は `[x, y]`、地図は `[lng, lat]`）
 */
export type Coordinates = [number, number];

/**
 * 拡大・縮小の基準点を表すキーワード（CSS の `transform-origin` と同じ）
 */
export type OriginKeyword =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | `${'top' | 'center' | 'bottom'} ${'left' | 'center' | 'right'}`
  | `${'left' | 'center' | 'right'} ${'top' | 'center' | 'bottom'}`;

/**
 * 拡大・縮小する軸
 */
export type ScaleAxis = 'both' | 'x' | 'y';

/**
 * polyline で補間した点を作るときに渡す情報
 */
export type PolylinePointContext<P> = {
  /**
   * 区間の始点
   */
  from: P;
  /**
   * 区間の終点
   */
  to: P;
  /**
   * 区間内の割合（外挿した場合は 0 〜 1 の範囲外になる）
   */
  ratio: number;
};

/**
 * polygon で拡大・縮小した点を作るときに渡す情報
 */
export type PolygonPointContext<P> = {
  /**
   * 元の点
   */
  source: P;
};

/**
 * 範囲外の t の扱い
 */
export type ExtrapolateOptions = {
  /**
   * t < 0 でも計算する
   */
  extrapolateStart?: boolean;
  /**
   * t > 1 でも計算する
   */
  extrapolateEnd?: boolean;
};

/**
 * ルート上の位置を求める関数のオプション
 */
export type RouteOptions<P> = ExtrapolateOptions & {
  /**
   * 点から座標を取り出す関数
   */
  getCoordinates?: (point: P) => Coordinates;
  /**
   * 座標から点を作る関数
   */
  createPoint?: (
    coordinates: Coordinates,
    context: PolylinePointContext<P>,
  ) => P;
};

/**
 * polyline 系の関数のオプション
 */
export type PolylineOptions<P> = RouteOptions<P> & {
  /**
   * 補間した点を加えず、到達した頂点までにする
   */
  snapToVertex?: boolean;
};

/**
 * polygon 系の関数のオプション
 */
export type PolygonOptions<P> = ExtrapolateOptions & {
  /**
   * 拡大・縮小の基準点
   */
  origin?: 'centroid' | OriginKeyword | P;
  /**
   * 拡大・縮小する軸
   */
  axis?: ScaleAxis;
  /**
   * 点から座標を取り出す関数
   */
  getCoordinates?: (point: P) => Coordinates;
  /**
   * 座標から点を作る関数
   */
  createPoint?: (
    coordinates: Coordinates,
    context: PolygonPointContext<P>,
  ) => P;
};

/**
 * MultiPolygon 系の関数のオプション
 */
export type MultiPolygonOptions<P> = PolygonOptions<P> & {
  /**
   * 基準点をポリゴンごとに求める
   */
  originPerPolygon?: boolean;
};

/**
 * t に応じた値を返す関数
 */
export type Interpolator<T> = (t: number) => T;

/**
 * イージング関数
 */
export type Easing = (t: number) => number;

/**
 * 丸め方（`Math` の関数名と同じ）
 */
export type Rounding = 'round' | 'floor' | 'ceil';

/**
 * 折れ線どうしのモーフィングで点を作るときに渡す情報
 */
export type PolylineMorphPointContext<P> = {
  /**
   * 補間前の折れ線の、直前の頂点（補間前の折れ線に点がない場合は `to` と同じ）
   */
  from: P;
  /**
   * 補間後の折れ線の、直前の頂点（補間後の折れ線に点がない場合は `from` と同じ）
   */
  to: P;
  /**
   * t の値
   */
  ratio: number;
};

/**
 * 折れ線どうしのモーフィングの関数のオプション
 */
export type PolylineMorphOptions<P> = ExtrapolateOptions & {
  /**
   * どちらかの折れ線に点がない場合に、広がる・縮む基準点。
   * `'start'`（始点）/ `'end'`（終点）/ `'center'`（全体の長さの半分の位置）/ 点。デフォルトは `'start'`
   */
  origin?: 'start' | 'end' | 'center' | P;
  /**
   * 点から座標を取り出す関数
   */
  getCoordinates?: (point: P) => Coordinates;
  /**
   * 座標から点を作る関数
   */
  createPoint?: (
    coordinates: Coordinates,
    context: PolylineMorphPointContext<P>,
  ) => P;
};

/**
 * 弧を作る関数のオプション
 */
export type ArcOptions<P> = {
  /**
   * 弧の高さを2点間の距離に対する割合で表す。正の値は進行方向の左、負の値は右に膨らむ。有限でない数の場合は 0.2 にする。デフォルトは 0.2
   */
  curvature?: number;
  /**
   * 弧を何本の線分で表すか。小数は四捨五入し、1 未満・有限でない数の場合は 64 にする。デフォルトは 64
   */
  segmentCount?: number;
  /**
   * 点から座標を取り出す関数
   */
  getCoordinates?: (point: P) => Coordinates;
  /**
   * 座標から点を作る関数。`context` の `ratio` は曲線上の位置（0 〜 1）
   */
  createPoint?: (
    coordinates: Coordinates,
    context: PolylinePointContext<P>,
  ) => P;
};
