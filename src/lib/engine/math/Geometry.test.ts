import { describe, it, expect } from 'vitest';
import { Vector2 } from './Vector2';
import { Rect } from './Rect';
import { LineSegment } from './LineSegment';

describe('Rect', () => {
    it('should create from points', () => {
        const points = [
            new Vector2(0, 0),
            new Vector2(10, 5),
            new Vector2(-5, 20)
        ];
        const rect = Rect.fromPoints(points);
        expect(rect.min.x).toBe(-5);
        expect(rect.min.y).toBe(0);
        expect(rect.max.x).toBe(10);
        expect(rect.max.y).toBe(20);
        expect(rect.width).toBe(15);
        expect(rect.height).toBe(20);
    });

    it('should check if it contains a point', () => {
        const rect = new Rect(new Vector2(0, 0), new Vector2(10, 10));
        expect(rect.contains(new Vector2(5, 5))).toBe(true);
        expect(rect.contains(new Vector2(-1, 5))).toBe(false);
        expect(rect.contains(new Vector2(11, 5))).toBe(false);
    });

    it('should check intersection with another rect', () => {
        const r1 = new Rect(new Vector2(0, 0), new Vector2(10, 10));
        const r2 = new Rect(new Vector2(5, 5), new Vector2(15, 15));
        const r3 = new Rect(new Vector2(20, 20), new Vector2(30, 30));

        expect(r1.intersects(r2)).toBe(true);
        expect(r1.intersects(r3)).toBe(false);
    });
});

describe('LineSegment', () => {
    it('should calculate length', () => {
        const l = new LineSegment(new Vector2(0, 0), new Vector2(3, 4));
        expect(l.length).toBe(5);
        expect(l.lengthSq).toBe(25);
    });

    it('should project point onto segment (inside)', () => {
        const l = new LineSegment(new Vector2(0, 0), new Vector2(10, 0));
        const p = new Vector2(5, 5);
        const proj = l.projectPoint(p);
        expect(proj.x).toBe(5);
        expect(proj.y).toBe(0);
    });

    it('should project point onto segment (clamped start)', () => {
        const l = new LineSegment(new Vector2(2, 0), new Vector2(10, 0));
        const p = new Vector2(0, 5); // Before start
        const proj = l.projectPoint(p);
        expect(proj.x).toBe(2);
        expect(proj.y).toBe(0);
    });

    it('should project point onto segment (clamped end)', () => {
        const l = new LineSegment(new Vector2(0, 0), new Vector2(10, 0));
        const p = new Vector2(12, 5); // After end
        const proj = l.projectPoint(p);
        expect(proj.x).toBe(10);
        expect(proj.y).toBe(0);
    });
});
