import { describe, it, expect } from 'vitest';
import { Path } from './Path';
import { PathNode, NodeType } from './PathNode';
import { Vector2 } from '../math/Vector2';

describe('Path', () => {
    it('containsPoint should return true for point inside square', () => {
        // 100x100 square at (0,0)
        const p0 = new PathNode(new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 0), NodeType.CORNER);
        const p1 = new PathNode(new Vector2(100, 0), new Vector2(100, 0), new Vector2(100, 0), NodeType.CORNER);
        const p2 = new PathNode(new Vector2(100, 100), new Vector2(100, 100), new Vector2(100, 100), NodeType.CORNER);
        const p3 = new PathNode(new Vector2(0, 100), new Vector2(0, 100), new Vector2(0, 100), NodeType.CORNER);

        const path = new Path([p0, p1, p2, p3], true);

        // Inside
        expect(path.containsPoint(new Vector2(50, 50))).toBe(true);
        expect(path.containsPoint(new Vector2(10, 10))).toBe(true);

        // Outside
        expect(path.containsPoint(new Vector2(-10, 50))).toBe(false);
        expect(path.containsPoint(new Vector2(110, 50))).toBe(false);
        expect(path.containsPoint(new Vector2(50, -10))).toBe(false);

        // Bounding box optimization check (far outside)
        expect(path.containsPoint(new Vector2(500, 500))).toBe(false);
    });

    it('containsPoint should return false for open path', () => {
        const p0 = new PathNode(new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 0), NodeType.CORNER);
        const p1 = new PathNode(new Vector2(100, 0), new Vector2(100, 0), new Vector2(100, 0), NodeType.CORNER);
        const p2 = new PathNode(new Vector2(100, 100), new Vector2(100, 100), new Vector2(100, 100), NodeType.CORNER);

        const path = new Path([p0, p1, p2], false); // Open

        expect(path.containsPoint(new Vector2(50, 10))).toBe(false);
    });
});
