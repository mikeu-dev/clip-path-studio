import { describe, it, expect } from 'vitest';
import { clamp, lerp, toRad, toDeg, equals, round } from './MathUtils';

describe('MathUtils', () => {
    it('should clamp values', () => {
        expect(clamp(10, 0, 5)).toBe(5);
        expect(clamp(-5, 0, 5)).toBe(0);
        expect(clamp(3, 0, 5)).toBe(3);
    });

    it('should lerp values', () => {
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should convert degrees to radians', () => {
        expect(toRad(180)).toBeCloseTo(Math.PI);
        expect(toRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it('should convert radians to degrees', () => {
        expect(toDeg(Math.PI)).toBeCloseTo(180);
        expect(toDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it('should compare with epsilon', () => {
        expect(equals(0.1 + 0.2, 0.3)).toBe(true);
        expect(equals(1, 1.0000000001)).toBe(true);
        expect(equals(1, 1.0001)).toBe(false);
    });

    it('should round to precision', () => {
        expect(round(1.2345, 2)).toBe(1.23);
        expect(round(1.235, 2)).toBe(1.24);
        expect(round(1.2345, 3)).toBe(1.235);
    });
});
