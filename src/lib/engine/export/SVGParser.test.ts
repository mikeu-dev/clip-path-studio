import { describe, it, expect } from 'vitest';
import { SVGParser } from './SVGParser';

describe('SVGParser', () => {
    it('should parse simple M L Z path', () => {
        const d = "M 0 0 L 100 0 L 100 100 Z";
        const paths = SVGParser.parse(d);

        expect(paths.length).toBe(1);
        expect(paths[0].nodes.length).toBe(3); // M, L, L. Z closes it.
        expect(paths[0].closed).toBe(true);
        expect(paths[0].nodes[1].position.x).toBe(100);
    });

    it('should parse C command', () => {
        const d = "M 0 0 C 10 0 20 10 30 10";
        const paths = SVGParser.parse(d);

        expect(paths.length).toBe(1); // One open path
        expect(paths[0].nodes.length).toBe(2); // M .. C (end point)

        // Check handles
        const node0 = paths[0].nodes[0];
        const node1 = paths[0].nodes[1];

        // Node 0 handleOut should be 10,0
        expect(node0.handleOut.x).toBe(10);
        expect(node0.handleOut.y).toBe(0);

        // Node 1 handleIn should be 20,10
        expect(node1.handleIn.x).toBe(20);
        expect(node1.handleIn.y).toBe(10);

        // Node 1 pos should be 30,10
        expect(node1.position.x).toBe(30);
    });
});
