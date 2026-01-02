import { describe, it, expect } from 'vitest';
import { Vector2 } from './Vector2';
import { CubicBezier } from './Bezier';

describe('CubicBezier', () => {
    // Simple curve: Straight line from (0,0) to (10,0)
    // Control points collinear: (0,0), (3,0), (6,0), (10,0)
    // Wait, straight line bezier needs proportional control points to be linear uniform? 
    // Not necessarily.

    it('should evaluate endpoints correctly', () => {
        const p0 = new Vector2(0, 0);
        const p1 = new Vector2(0, 10);
        const p2 = new Vector2(10, 10);
        const p3 = new Vector2(10, 0);
        const curve = new CubicBezier(p0, p1, p2, p3);

        const start = curve.evaluate(0);
        const end = curve.evaluate(1);

        expect(start.x).toBe(0);
        expect(start.y).toBe(0);
        expect(end.x).toBe(10);
        expect(end.y).toBe(0);
    });

    it('should evaluate midpoint', () => {
        // Symmetric arc
        const curve = new CubicBezier(
            new Vector2(0, 0),
            new Vector2(0, 10),
            new Vector2(10, 10),
            new Vector2(10, 0)
        );
        const mid = curve.evaluate(0.5);
        // By symmetry, x should be 5.
        // y is 0.125*0 + 0.375*10 + 0.375*10 + 0.125*0 = 3.75 + 3.75 = 7.5
        expect(mid.x).toBeCloseTo(5);
        expect(mid.y).toBeCloseTo(7.5);
    });

    it('should calculate tangent', () => {
        const curve = new CubicBezier(
            new Vector2(0, 0),
            new Vector2(0, 10),
            new Vector2(10, 10),
            new Vector2(10, 0)
        );

        // Tangent at 0 should be direction P0 -> P1 (0, 1) usually
        const t0 = curve.tangent(0);
        expect(t0.x).toBe(0);
        expect(t0.y).toBe(1);

        // Tangent at 1 should be direction P2 -> P3 (0, -10) -> normalized (0, -1)
        const t1 = curve.tangent(1);
        expect(t1.x).toBe(0);
        expect(t1.y).toBe(-1);
    });

    it('should split curve', () => {
        const curve = new CubicBezier(
            new Vector2(0, 0),
            new Vector2(0, 10),
            new Vector2(10, 10),
            new Vector2(10, 0)
        );

        const [left, right] = curve.split(0.5);

        // Left curve should start at P0 and end at Mid
        // Right curve should start at Mid and end at P3
        expect(left.p0.equals(curve.p0)).toBe(true);
        expect(left.p3.x).toBeCloseTo(5);
        expect(left.p3.y).toBeCloseTo(7.5); // Mid point

        expect(right.p0.x).toBeCloseTo(5);
        expect(right.p0.y).toBeCloseTo(7.5);
        expect(right.p3.equals(curve.p3)).toBe(true);
    });

    it('should calculate bounding box', () => {
        const curve = new CubicBezier(
            new Vector2(0, 0),
            new Vector2(0, 10), // Control point pulls up
            new Vector2(10, 10), // Control point pulls up
            new Vector2(10, 0)
        );
        // Extrema should be at t=0.5 (y=7.5)
        // X range: 0 to 10
        // Y range: 0 to 7.5

        const bbox = curve.getBoundingBox();
        expect(bbox.min.x).toBeCloseTo(0);
        expect(bbox.max.x).toBeCloseTo(10);
        expect(bbox.min.y).toBeCloseTo(0);
        expect(bbox.max.y).toBeCloseTo(7.5);
    });
});
