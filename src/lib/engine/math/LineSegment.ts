import { Vector2 } from './Vector2';
import { clamp } from './MathUtils';

export class LineSegment {
    readonly start: Vector2;
    readonly end: Vector2;

    constructor(start: Vector2, end: Vector2) {
        this.start = start;
        this.end = end;
    }

    get length(): number {
        return this.start.distanceTo(this.end);
    }

    get lengthSq(): number {
        return this.start.distanceToSq(this.end);
    }

    get direction(): Vector2 {
        return this.end.sub(this.start).normalize();
    }

    /**
     * Get point at t (0 to 1)
     */
    getPoint(t: number): Vector2 {
        return this.start.lerp(this.end, t);
    }

    /**
     * Project point p onto the line segment.
     * Returns the closest point on the segment.
     */
    projectPoint(p: Vector2): Vector2 {
        const l2 = this.lengthSq;
        if (l2 === 0) return this.start;

        // Consider the line extending the segment, parameterized as start + t (end - start).
        // We find projection of point p onto the line. 
        // It falls where t = [(p-start) . (end-start)] / |end-start|^2
        // We clamp t from [0,1] to handle points outside the segment start/end.
        const t = ((p.x - this.start.x) * (this.end.x - this.start.x) + (p.y - this.start.y) * (this.end.y - this.start.y)) / l2;
        const clampedT = clamp(t, 0, 1);

        return this.start.add(this.end.sub(this.start).mul(clampedT));
    }

    /**
     * Distance squared from p to the closest point on segment
     */
    distanceToPointSq(p: Vector2): number {
        const projection = this.projectPoint(p);
        return p.distanceToSq(projection);
    }

    distanceToPoint(p: Vector2): number {
        return Math.sqrt(this.distanceToPointSq(p));
    }
}
