import { Vector2 } from './Vector2';
import { Rect } from './Rect';
import { EPSILON } from './MathUtils';
import { LineSegment } from './LineSegment';

export interface Intersection {
    point: Vector2;
    t1: number;
    t2: number;
}

/**
 * Cubic Bezier Curve defined by 4 control points: p0, p1, p2, p3.
 * p0: start point
 * p1: control point 1
 * p2: control point 2
 * p3: end point
 */
export class CubicBezier {
    readonly p0: Vector2;
    readonly p1: Vector2;
    readonly p2: Vector2;
    readonly p3: Vector2;

    constructor(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    /**
     * Evaluate the curve at parameter t [0, 1] using De Casteljau's algorithm
     */
    evaluate(t: number): Vector2 {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        // B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
        return new Vector2(
            this.p0.x * mt3 + this.p1.x * 3 * mt2 * t + this.p2.x * 3 * mt * t2 + this.p3.x * t3,
            this.p0.y * mt3 + this.p1.y * 3 * mt2 * t + this.p2.y * 3 * mt * t2 + this.p3.y * t3
        );
    }

    /**
     * Evaluate tangent vector at scalar t
     * Derivative of cubic bezier is a quadratic bezier.
     */
    tangent(t: number): Vector2 {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;

        // derivative coefficients
        // d0 = 3(p1 - p0)
        // d1 = 3(p2 - p1)
        // d2 = 3(p3 - p2)

        // Q(t) = (1-t)^2*d0 + 2(1-t)*t*d1 + t^2*d2

        const d0 = this.p1.sub(this.p0).mul(3);
        const d1 = this.p2.sub(this.p1).mul(3);
        const d2 = this.p3.sub(this.p2).mul(3);

        return new Vector2(
            d0.x * mt2 + d1.x * 2 * mt * t + d2.x * t2,
            d0.y * mt2 + d1.y * 2 * mt * t + d2.y * t2
        ).normalize(); // Normalized tangent
    }

    /**
     * Split the curve at parameter t into two curves [left, right]
     */
    split(t: number): [CubicBezier, CubicBezier] {
        const p0 = this.p0;
        const p1 = this.p1;
        const p2 = this.p2;
        const p3 = this.p3;

        // Level 1
        const p01 = p0.lerp(p1, t);
        const p12 = p1.lerp(p2, t);
        const p23 = p2.lerp(p3, t);

        // Level 2
        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        // Level 3 (point on curve)
        const p0123 = p012.lerp(p123, t);

        const left = new CubicBezier(p0, p01, p012, p0123);
        const right = new CubicBezier(p0123, p123, p23, p3);

        return [left, right];
    }

    /**
     * Calculate bounding box needed to contain the curve
     * AABB is formed by P0, P3, and extrema points where derivative is 0.
     */
    getBoundingBox(): Rect {
        // Start with endpoints
        let minX = Math.min(this.p0.x, this.p3.x);
        let maxX = Math.max(this.p0.x, this.p3.x);
        let minY = Math.min(this.p0.y, this.p3.y);
        let maxY = Math.max(this.p0.y, this.p3.y);

        // Implementing generic extrema finder
        const getExtrema = (p0: number, p1: number, p2: number, p3: number): number[] => {
            const a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3);
            const b = 6 * (p0 - 2 * p1 + p2);
            const c = 3 * (p1 - p0);

            const roots: number[] = [];
            // at^2 + bt + c = 0
            if (Math.abs(a) < EPSILON) {
                if (Math.abs(b) > EPSILON) {
                    const t = -c / b;
                    if (t > 0 && t < 1) roots.push(t);
                }
            } else {
                const disc = b * b - 4 * a * c;
                if (disc >= 0) {
                    const s = Math.sqrt(disc);
                    const t1 = (-b + s) / (2 * a);
                    const t2 = (-b - s) / (2 * a);
                    if (t1 > 0 && t1 < 1) roots.push(t1);
                    if (t2 > 0 && t2 < 1) roots.push(t2);
                }
            }
            return roots;
        };

        const xRoots = getExtrema(this.p0.x, this.p1.x, this.p2.x, this.p3.x);
        const yRoots = getExtrema(this.p0.y, this.p1.y, this.p2.y, this.p3.y);

        xRoots.forEach(t => {
            const x = this.evaluate(t).x;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
        });

        yRoots.forEach(t => {
            const y = this.evaluate(t).y;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        return new Rect(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    /**
     * Check if curve is flat enough to be treated as a line segment
     */
    isFlat(tolerance: number = 0.5): boolean {
        // Distance of p1 and p2 from line p0-p3
        const line = new LineSegment(this.p0, this.p3);
        const d1 = line.distanceToPointSq(this.p1);
        const d2 = line.distanceToPointSq(this.p2);

        return d1 < tolerance * tolerance && d2 < tolerance * tolerance;
    }

    /**
     * Find intersection points with another cubic bezier.
     * Uses divide and conquer (Bezier Clipping / Subdivision).
     */
    intersects(
        other: CubicBezier,
        threshold: number = 0.1,
        depth: number = 0,
        t1Range: [number, number] = [0, 1],
        t2Range: [number, number] = [0, 1]
    ): Intersection[] {
        // 1. Bounding Box Optimization
        if (!this.getBoundingBox().intersects(other.getBoundingBox())) {
            return [];
        }

        // 2. Base case: max depth or flatness
        // If we are deep enough, or both curves are flat, we intersect them as segments
        if (depth > 12 || (this.isFlat(threshold) && other.isFlat(threshold))) {
            const l1 = new LineSegment(this.p0, this.p3);
            const l2 = new LineSegment(other.p0, other.p3);
            const intersection = l1.intersects(l2);

            if (intersection) {
                // Map intersection point to t values
                const getT = (seg: LineSegment, p: Vector2) => {
                    const lenSq = seg.lengthSq;
                    if (lenSq < EPSILON) return 0;
                    return p.sub(seg.start).dot(seg.end.sub(seg.start)) / lenSq;
                };

                const localT1 = getT(l1, intersection);
                const localT2 = getT(l2, intersection);

                const t1 = t1Range[0] + (t1Range[1] - t1Range[0]) * localT1;
                const t2 = t2Range[0] + (t2Range[1] - t2Range[0]) * localT2;

                return [{
                    point: intersection,
                    t1: Math.max(0, Math.min(1, t1)),
                    t2: Math.max(0, Math.min(1, t2))
                }];
            }
            return [];
        }

        // 3. Recursive step
        const mid1 = (t1Range[0] + t1Range[1]) / 2;
        const mid2 = (t2Range[0] + t2Range[1]) / 2;

        const thisSplit = this.split(0.5);
        const otherSplit = other.split(0.5);

        const results: Intersection[] = [];

        // Check all 4 combinations
        const pairs: { c1: CubicBezier, c2: CubicBezier, r1: [number, number], r2: [number, number] }[] = [
            { c1: thisSplit[0], c2: otherSplit[0], r1: [t1Range[0], mid1], r2: [t2Range[0], mid2] },
            { c1: thisSplit[0], c2: otherSplit[1], r1: [t1Range[0], mid1], r2: [mid2, t2Range[1]] },
            { c1: thisSplit[1], c2: otherSplit[0], r1: [mid1, t1Range[1]], r2: [t2Range[0], mid2] },
            { c1: thisSplit[1], c2: otherSplit[1], r1: [mid1, t1Range[1]], r2: [mid2, t2Range[1]] }
        ];

        for (const pair of pairs) {
            const points = pair.c1.intersects(pair.c2, threshold, depth + 1, pair.r1, pair.r2);
            results.push(...points);
        }

        // Deduplicate points (close points)
        const unique: Intersection[] = [];
        for (const res of results) {
            let found = false;
            for (const u of unique) {
                if (res.point.distanceToSq(u.point) < threshold * threshold) {
                    found = true;
                    break;
                }
            }
            if (!found) unique.push(res);
        }

        return unique;
    }

    reverse(): CubicBezier {
        return new CubicBezier(this.p3, this.p2, this.p1, this.p0);
    }
}
