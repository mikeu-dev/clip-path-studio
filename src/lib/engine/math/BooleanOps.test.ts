import { describe, it, expect } from 'vitest';
import { BooleanOps } from './BooleanOps';
import { Path } from '../core/Path';
import { PathNode, NodeType } from '../core/PathNode';
import { Vector2 } from './Vector2';

describe('BooleanOps', () => {
    // Helper to create a square path
    const createSquare = (x: number, y: number, size: number) => {
        const p0 = new Vector2(x, y);
        const p1 = new Vector2(x + size, y);
        const p2 = new Vector2(x + size, y + size);
        const p3 = new Vector2(x, y + size);

        return new Path([
            new PathNode(p0, p0, p0, NodeType.CORNER),
            new PathNode(p1, p1, p1, NodeType.CORNER),
            new PathNode(p2, p2, p2, NodeType.CORNER),
            new PathNode(p3, p3, p3, NodeType.CORNER)
        ], true);
    };

    it('should union two disjoint squares', () => {
        const s1 = createSquare(0, 0, 100);
        const s2 = createSquare(200, 0, 100);

        const result = BooleanOps.union(s1, s2);

        expect(result.length).toBe(2);
    });

    it('should union two overlapping squares', () => {
        // Square 1: (0,0) to (100,100)
        const s1 = createSquare(0, 0, 100);
        // Square 2: (50,50) to (150,150) -- Shifts diagonal
        const s2 = createSquare(50, 50, 100);

        const result = BooleanOps.union(s1, s2);

        // Should return 1 path
        expect(result.length).toBe(1);
        const res = result[0];
        const bbox = res.getBoundingBox();

        expect(bbox.min.x).toBeCloseTo(0);
        expect(bbox.max.x).toBeCloseTo(150);
        expect(bbox.min.y).toBeCloseTo(0);
        expect(bbox.max.y).toBeCloseTo(150);
    });

    it('should subtract overlapping squares', () => {
        // Square 1: (0,0) to (100,100)
        const s1 = createSquare(0, 0, 100);
        // Square 2: (50,50) to (150,150)
        const s2 = createSquare(50, 50, 100);

        // s1 - s2 should be L-shape.
        // Bounding box: 0,0 to 100,100 (original extent)

        const result = BooleanOps.subtract(s1, s2);

        expect(result.length).toBe(1);
        const bbox = result[0].getBoundingBox();
        expect(bbox.min.x).toBeCloseTo(0);
        expect(bbox.max.x).toBeCloseTo(100);
        expect(bbox.min.y).toBeCloseTo(0);
        expect(bbox.max.y).toBeCloseTo(100);

        // Check point containment
        expect(result[0].containsPoint(new Vector2(25, 25))).toBe(true);
        expect(result[0].containsPoint(new Vector2(75, 75))).toBe(false); // In S2
    });

    it('should subtract fully contained square (hole)', () => {
        const outer = createSquare(0, 0, 100);
        const inner = createSquare(25, 25, 50);

        const result = BooleanOps.subtract(outer, inner);

        // Ideally: 2 paths (Outer CCW, Inner CW) or just 2 paths representing the shape
        expect(result.length).toBe(2);
    });
});
