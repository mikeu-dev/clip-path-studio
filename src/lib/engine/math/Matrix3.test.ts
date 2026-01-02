import { describe, it, expect } from 'vitest';
import { Matrix3 } from './Matrix3';
import { Vector2 } from './Vector2';

describe('Matrix3', () => {
    it('should create identity matrix', () => {
        const m = Matrix3.identity;
        const v = new Vector2(10, 20);
        const transformed = m.transformPoint(v);
        expect(transformed.x).toBe(10);
        expect(transformed.y).toBe(20);
    });

    it('should translate point', () => {
        const t = Matrix3.translate(10, 5);
        const v = new Vector2(10, 10);
        const result = t.transformPoint(v);
        expect(result.x).toBe(20);
        expect(result.y).toBe(15);
    });

    it('should scale point', () => {
        const s = Matrix3.scale(2, 3);
        const v = new Vector2(10, 10);
        const result = s.transformPoint(v);
        expect(result.x).toBe(20);
        expect(result.y).toBe(30);
    });

    it('should rotate point', () => {
        // Rotate 90 degrees (PI/2)
        const r = Matrix3.rotate(Math.PI / 2);
        const v = new Vector2(10, 0);
        const result = r.transformPoint(v);
        // cos(90)=0, sin(90)=1
        // x' = 0*10 - 1*0 = 0
        // y' = 1*10 + 0*0 = 10
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(10);
    });

    it('should multiply matrices (combine transforms)', () => {
        // Translate then Scale?
        // M = T * S
        // v' = M * v = T * (S * v)
        // Scale first, then Translate
        const t = Matrix3.translate(10, 20);
        const s = Matrix3.scale(2, 2);

        // Combine T * S
        const m = t.multiply(s);

        // Point (5, 5) -> Scale(10, 10) -> Translate(20, 30)
        const v = new Vector2(5, 5);
        const result = m.transformPoint(v);

        expect(result.x).toBe(20);
        expect(result.y).toBe(30);
    });

    it('should inverse translation', () => {
        const t = Matrix3.translate(10, 20);
        const inv = t.inverse();
        const v = new Vector2(20, 30);

        const result = inv.transformPoint(v);
        expect(result.x).toBe(10);
        expect(result.y).toBe(10);
    });
});
