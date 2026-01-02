import { describe, it, expect } from 'vitest';
import { PathNode, NodeType } from './PathNode';
import { Path } from './Path';
import { Vector2 } from '../math/Vector2';

describe('PathNode', () => {
    it('should create defaults', () => {
        const node = PathNode.corner(10, 20);
        expect(node.position.x).toBe(10);
        expect(node.type).toBe(NodeType.CORNER);
        expect(node.handleIn.equals(node.position)).toBe(true);
    });

    it('should be immutable on update', () => {
        const node = PathNode.corner(0, 0);
        const updated = node.update({ position: new Vector2(10, 10) });

        expect(node.position.x).toBe(0); // Original unchanged
        expect(updated.position.x).toBe(10); // New instance
        expect(updated.id).toBe(node.id); // ID preserved
    });

    it('should serialize to JSON correctly', () => {
        const node = new PathNode(
            new Vector2(10, 10),
            new Vector2(0, 0),
            new Vector2(20, 20),
            NodeType.SMOOTH
        );
        const json = node.toJSON();

        expect(json.x).toBe(10);
        expect(json.inX).toBe(0);
        expect(json.outX).toBe(20);
        expect(json.type).toBe('smooth');
    });

    it('should omit handles if same as position (corner)', () => {
        const node = PathNode.corner(5, 5);
        const json = node.toJSON();
        expect(json.inX).toBeUndefined();
        expect(json.outX).toBeUndefined();
    });
});

describe('Path', () => {
    it('should add nodes immutably', () => {
        const path = new Path();
        const node = PathNode.corner(0, 0);
        const path2 = path.addNode(node);

        expect(path.length).toBe(0);
        expect(path2.length).toBe(1);
    });

    it('should convert to curves (open)', () => {
        const p1 = PathNode.corner(0, 0);
        const p2 = PathNode.corner(10, 0); // straight line effectively
        const path = new Path([p1, p2], false);

        const curves = path.toCurves();
        expect(curves.length).toBe(1);
        expect(curves[0].p0.equals(p1.position)).toBe(true);
        expect(curves[0].p3.equals(p2.position)).toBe(true);
    });

    it('should convert to curves (closed)', () => {
        const p1 = PathNode.corner(0, 0);
        const p2 = PathNode.corner(10, 0);
        const p3 = PathNode.corner(10, 10);
        const path = new Path([p1, p2, p3], true);

        const curves = path.toCurves();
        expect(curves.length).toBe(3);
        // Last curve connects p3 to p1
        expect(curves[2].p0.equals(p3.position)).toBe(true);
        expect(curves[2].p3.equals(p1.position)).toBe(true);
    });

    it('should serialize and deserialize', () => {
        const p1 = PathNode.corner(0, 0);
        const p2 = PathNode.corner(10, 10);
        const path = new Path([p1, p2], true);

        const json = path.toJSON();
        const restored = Path.fromJSON(json);

        expect(restored.id).toBe(path.id);
        expect(restored.length).toBe(2);
        expect(restored.closed).toBe(true);
        expect(restored.nodes[1].position.x).toBe(10);
    });
});
