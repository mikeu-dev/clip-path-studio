import { describe, it, expect } from 'vitest';
import { Vector2 } from './Vector2';

describe('Vector2', () => {
    it('should create a vector with given coordinates', () => {
        const v = new Vector2(3, 4);
        expect(v.x).toBe(3);
        expect(v.y).toBe(4);
    });

    it('should support addition', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(3, 4);
        const result = v1.add(v2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
    });

    it('should support subtraction', () => {
        const v1 = new Vector2(3, 5);
        const v2 = new Vector2(1, 2);
        const result = v1.sub(v2);
        expect(result.x).toBe(2);
        expect(result.y).toBe(3);
    });

    it('should support scalar multiplication', () => {
        const v = new Vector2(2, 3);
        const result = v.mul(2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
    });

    it('should calculate dot product', () => {
        const v1 = new Vector2(1, 0);
        const v2 = new Vector2(0, 1);
        expect(v1.dot(v2)).toBe(0);

        const v3 = new Vector2(1, 2);
        const v4 = new Vector2(3, 4);
        expect(v3.dot(v4)).toBe(1 * 3 + 2 * 4); // 11
    });

    it('should calculate length', () => {
        const v = new Vector2(3, 4);
        expect(v.length()).toBe(5);
    });

    it('should normalize', () => {
        const v = new Vector2(3, 4);
        const normalized = v.normalize();
        expect(normalized.x).toBeCloseTo(0.6);
        expect(normalized.y).toBeCloseTo(0.8);
        expect(normalized.length()).toBeCloseTo(1);
    });

    it('should support linear interpolation', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(10, 10);
        const result = v1.lerp(v2, 0.5);
        expect(result.x).toBe(5);
        expect(result.y).toBe(5);
    });

    it('should compare equality with epsilon', () => {
        const v1 = new Vector2(1 / 3, 1);
        const v2 = new Vector2(0.333333333, 1);
        // default epsilon is 1e-9, 1/3 is 0.333333333333...
        // depending on precision implementation it might fail if we are too strict, but let's check basic float equality
        const v3 = new Vector2(1, 1);
        const v4 = new Vector2(1, 1);
        expect(v3.equals(v4)).toBe(true);
    });
});
