import { Vector2 } from './Vector2';

/**
 * Axis-Aligned Bounding Box (AABB)
 * Defined by min and max points.
 */
export class Rect {
    readonly min: Vector2;
    readonly max: Vector2;

    constructor(min: Vector2 = Vector2.zero, max: Vector2 = Vector2.zero) {
        this.min = min;
        this.max = max;
    }

    static fromPoints(points: Vector2[]): Rect {
        if (points.length === 0) return new Rect();

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }

        return new Rect(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    // x, y, width, height getters
    get x(): number { return this.min.x; }
    get y(): number { return this.min.y; }
    get width(): number { return this.max.x - this.min.x; }
    get height(): number { return this.max.y - this.min.y; }

    get center(): Vector2 {
        return this.min.add(this.max).mul(0.5);
    }

    contains(point: Vector2): boolean {
        return point.x >= this.min.x && point.x <= this.max.x &&
            point.y >= this.min.y && point.y <= this.max.y;
    }

    intersects(other: Rect): boolean {
        return this.min.x <= other.max.x && this.max.x >= other.min.x &&
            this.min.y <= other.max.y && this.max.y >= other.min.y;
    }

    union(other: Rect): Rect {
        const minX = Math.min(this.min.x, other.min.x);
        const minY = Math.min(this.min.y, other.min.y);
        const maxX = Math.max(this.max.x, other.max.x);
        const maxY = Math.max(this.max.y, other.max.y);
        return new Rect(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    expand(amount: number): Rect {
        return new Rect(
            this.min.sub(amount),
            this.max.add(amount)
        );
    }

    toString(): string {
        return `Rect(min:${this.min}, max:${this.max})`;
    }
}
