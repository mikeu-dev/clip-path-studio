import { PathNode } from './PathNode';
import { CubicBezier } from '../math/Bezier';
import { Vector2 } from '../math/Vector2';
import { Matrix3 } from '../math/Matrix3';
import { Rect } from '../math/Rect';

export interface IPathData {
    id: string;
    nodes: ReturnType<PathNode['toJSON']>[];
    closed: boolean;
    transform?: number[]; // Matrix3 elements
}

export class Path {
    readonly id: string;
    readonly nodes: ReadonlyArray<PathNode>;
    readonly closed: boolean;
    readonly transform: Matrix3;

    constructor(nodes: PathNode[] = [], closed: boolean = false, transform: Matrix3 = Matrix3.identity, id: string = crypto.randomUUID()) {
        this.nodes = Object.freeze([...nodes]); // Immutable array
        this.closed = closed;
        this.transform = transform;
        this.id = id;
    }

    get length(): number {
        return this.nodes.length;
    }

    /**
     * Convert path to array of CubicBezier curves.
     * Handles closed paths by connecting last to first.
     */
    toCurves(): CubicBezier[] {
        const curves: CubicBezier[] = [];
        if (this.nodes.length < 2) return curves;

        for (let i = 0; i < this.nodes.length - 1; i++) {
            const current = this.nodes[i];
            const next = this.nodes[i + 1];

            curves.push(new CubicBezier(
                current.position,
                current.handleOut,
                next.handleIn,
                next.position
            ));
        }

        if (this.closed && this.nodes.length > 1) {
            const last = this.nodes[this.nodes.length - 1];
            const first = this.nodes[0];
            curves.push(new CubicBezier(
                last.position,
                last.handleOut,
                first.handleIn,
                first.position
            ));
        }

        return curves;
    }

    getBoundingBox(): Rect {
        const curves = this.toCurves();
        if (curves.length === 0) {
            if (this.nodes.length === 1) {
                const p = this.nodes[0].position;
                return new Rect(p, p);
            }
            return new Rect();
        }

        let r = curves[0].getBoundingBox();
        for (let i = 1; i < curves.length; i++) {
            r = r.union(curves[i].getBoundingBox());
        }
        return r;
    }

    /**
     * Check if point is inside the path using Ray Casting algorithm.
     * Casts a ray to the right and counts intersections.
     * Odd intersections = Inside.
     */
    containsPoint(point: Vector2): boolean {
        if (!this.closed) return false;

        const bounds = this.getBoundingBox();
        if (!bounds.contains(point)) return false;

        // Create a ray to the right, outside the bounding box
        // Use a slight y-offset to avoid hitting horizontal lines perfectly or vertices directly?
        // Standard robust way: Ray y = point.y. 
        // We'll use a large enough X.
        const rayEnd = new Vector2(bounds.max.x + 1000, point.y);

        // Construct a flat Bezier for the ray
        const rayCurve = new CubicBezier(
            point,
            point.lerp(rayEnd, 0.33),
            point.lerp(rayEnd, 0.66),
            rayEnd
        );

        let intersections = 0;
        const curves = this.toCurves();

        for (const curve of curves) {
            const hits = curve.intersects(rayCurve);
            // We need to deduplicate or handle vertices.
            // intersects() returns points.
            // If we have multiple hits, we count them.
            // BUT: intersects implementation treats curves solidly?
            // If intersects returns unique points, we assume typically 0 or 1 per curve for a horizontal ray (unless curve is horizontal).

            // Filter distinct hits (check x > point.x)
            for (const hit of hits) {
                if (hit.point.x > point.x) {
                    intersections++;
                }
            }
        }

        return intersections % 2 === 1;
    }

    // --- Immutable Mutations ---

    addNode(node: PathNode): Path {
        return new Path([...this.nodes, node], this.closed, this.transform, this.id);
    }

    insertNode(index: number, node: PathNode): Path {
        const newNodes = [...this.nodes];
        newNodes.splice(index, 0, node);
        return new Path(newNodes, this.closed, this.transform, this.id);
    }

    removeNode(id: string): Path {
        return new Path(this.nodes.filter(n => n.id !== id), this.closed, this.transform, this.id);
    }

    updateNode(index: number, node: PathNode): Path {
        if (index < 0 || index >= this.nodes.length) return this;
        const newNodes = [...this.nodes];
        newNodes[index] = node;
        return new Path(newNodes, this.closed, this.transform, this.id);
    }

    setClosed(closed: boolean): Path {
        return new Path([...this.nodes], closed, this.transform, this.id);
    }

    setTransform(transform: Matrix3): Path {
        return new Path(this.nodes as PathNode[], this.closed, transform, this.id);
    }

    // --- Serialization ---

    toJSON(): IPathData {
        return {
            id: this.id,
            nodes: this.nodes.map(n => n.toJSON()),
            closed: this.closed,
            transform: Array.from(this.transform.elements)
        };
    }

    static fromJSON(data: IPathData): Path {
        const nodes = data.nodes.map(n => PathNode.fromJSON(n));
        const transform = data.transform ? Matrix3.fromArray(data.transform) : Matrix3.identity;
        return new Path(nodes, data.closed, transform, data.id);
    }
}
