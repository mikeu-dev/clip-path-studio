import type { Path } from '../core/Path';
import { CubicBezier, type Intersection } from './Bezier';
import { PathNode, NodeType } from '../core/PathNode';
import { Vector2 } from './Vector2';

/**
 * Graph Edge representing a segment of a curve
 */
export interface CurveSegment {
    curve: CubicBezier;
    t1: number; // Start t on original curve
    t2: number; // End t on original curve
    originalPathIndex: 0 | 1; // 0 for Path A, 1 for Path B
    isInside: boolean;
}

export class BooleanOps {
    /**
     * Compute union of two paths
     */
    static union(pathA: Path, pathB: Path): Path[] {
        return this.performOp(pathA, pathB, (isInA, isInB, fromA) => {
            // Union: Keep A if OUTSIDE B, Keep B if OUTSIDE A
            if (fromA) return !isInB;
            return !isInA;
        });
    }

    static subtract(pathA: Path, pathB: Path): Path[] {
        return this.performOp(pathA, pathB, (isInA, isInB, fromA) => {
            // Subtract A - B: Keep A if OUTSIDE B, Keep B if INSIDE A (reversed?)
            // Actually: Keep parts of A that are NOT in B.
            // And segments of B? They form the "cut" boundary.
            // The boundary of B inside A needs to be included, but reversed direction.
            // For simple graph approach, we just classify "Inside A" and "Inside B".
            if (fromA) return !isInB; // A outside B
            return isInA; // B inside A (we reverse B segments typically or traverse appropriately)
        });
    }

    private static performOp(
        pathA: Path,
        pathB: Path,
        filter: (isInA: boolean, isInB: boolean, fromA: boolean) => boolean
    ): Path[] {
        if (!pathA.closed || !pathB.closed) return []; // Only closed paths supported for now

        // 1. Get Intersections
        const intersections = this.computeIntersections(pathA, pathB);

        // 2. Split Paths into Segments
        const segmentsA = this.splitPath(pathA, intersections.get(pathA) || [], 0);
        const segmentsB = this.splitPath(pathB, intersections.get(pathB) || [], 1);

        const allSegments = [...segmentsA, ...segmentsB];

        // 3. Classify Segments
        for (const seg of segmentsA) {
            // Check midpoint
            const mid = seg.curve.evaluate(0.5);
            seg.isInside = pathB.containsPoint(mid);
        }
        for (const seg of segmentsB) {
            const mid = seg.curve.evaluate(0.5);
            seg.isInside = pathA.containsPoint(mid);
        }

        // 4. Filter Edges
        const keptSegments = allSegments.filter(seg => {
            // For now, simple inside check.
            // For subtract, we might need direction flip.
            // Let's trust generic filter for now.
            const fromA = seg.originalPathIndex === 0;
            return filter(seg.isInside && !fromA, seg.isInside && fromA, fromA);
            // Wait, logic above:
            // segmentA.isInside means "Inside B"
            // segmentB.isInside means "Inside A"

            // Union filter:
            // if fromA, keep if !isInside (Outside B)
            // if fromB, keep if !isInside (Outside A)
        });

        // 5. Reconstruct
        // TODO: Implement Reconstruction
        // return this.reconstructPaths(keptSegments);
        return [];
    }

    private static computeIntersections(pathA: Path, pathB: Path): Map<Path, { curveIndex: number, t: number }[]> {
        const curvesA = pathA.toCurves();
        const curvesB = pathB.toCurves();
        const map = new Map<Path, { curveIndex: number, t: number }[]>();

        const hitsA: { curveIndex: number, t: number }[] = [];
        const hitsB: { curveIndex: number, t: number }[] = [];

        for (let i = 0; i < curvesA.length; i++) {
            for (let j = 0; j < curvesB.length; j++) {
                const results = curvesA[i].intersects(curvesB[j]);
                for (const res of results) {
                    hitsA.push({ curveIndex: i, t: res.t1 });
                    hitsB.push({ curveIndex: j, t: res.t2 });
                }
            }
        }

        map.set(pathA, hitsA);
        map.set(pathB, hitsB);
        return map;
    }

    private static splitPath(path: Path, intersections: { curveIndex: number, t: number }[], pathIndex: 0 | 1): CurveSegment[] {
        const curves = path.toCurves();
        const segments: CurveSegment[] = [];

        // Group intersections by curveIndex
        const byCurve = new Map<number, number[]>();
        for (const hit of intersections) {
            if (!byCurve.has(hit.curveIndex)) byCurve.set(hit.curveIndex, []);
            byCurve.get(hit.curveIndex)?.push(hit.t);
        }

        for (let i = 0; i < curves.length; i++) {
            let ts = byCurve.get(i) || [];
            // Sort and add 0 and 1
            ts = [0, ...ts.sort((a, b) => a - b), 1];
            // Deduplicate (approx)
            ts = ts.filter((t, idx) => idx === 0 || t > ts[idx - 1] + 1e-5);

            for (let j = 0; j < ts.length - 1; j++) {
                const tStart = ts[j];
                const tEnd = ts[j + 1];

                // Extract sub-curve
                // To extract [t1, t2] from a curve:
                // Split at t2 (of original) -> take Left.
                // Then split resulting curve at t1/t2 (remapped).
                // Easier: Split at t2 -> Left is [0, t2].
                // Then split that at t1/t2?

                // Let's do: Split curve at tStart -> Right part is [tStart, 1].
                // But tEnd is relative to original 0-1.
                // Right part parameter map: t' = (t - tStart) / (1 - tStart).
                // So split Right part at (tEnd - tStart) / (1 - tStart) -> Left part.

                const c = curves[i];
                let segmentCurve: CubicBezier;

                if (Math.abs(tEnd - tStart) < 1e-5) continue; // Tiny segment

                const [_, right] = c.split(tStart);
                // re-normalize tEnd for "right" curve
                const tEndRemapped = (tEnd - tStart) / (1 - tStart);
                const [final, __] = right.split(tEndRemapped);
                segmentCurve = final;

                segments.push({
                    curve: segmentCurve,
                    t1: tStart,
                    t2: tEnd,
                    originalPathIndex: pathIndex,
                    isInside: false // filled later
                });
            }
        }

        return segments;
    }
}
