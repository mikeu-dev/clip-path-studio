/**
 * Utilitas matematika dasar untuk Clip Path Studio
 */

export const EPSILON = 1e-9;

/**
 * Membandingkan dua angka floating point dengan toleransi epsilon
 */
export function equals(a: number, b: number, epsilon = EPSILON): boolean {
    return Math.abs(a - b) < epsilon;
}

/**
 * Membatasi nilai antara min dan max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Konversi derajat ke radian
 */
export function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Konversi radian ke derajat
 */
export function toDeg(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Round a number to a fixed precision
 */
export function round(value: number, precision: number = 3): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}
