import { Vector2 } from '../math/Vector2';
import { Path } from '../core/Path';
import { PathNode } from '../core/PathNode';

export interface HitResult {
    type: 'node' | 'handle-in' | 'handle-out' | 'path';
    pathId: string;
    nodeId?: string;
    nodeIndex?: number;
    distance: number;
}

export class HitTest {
    static findHit(paths: Path[], point: Vector2, threshold: number = 5, handleThreshold: number = 4): HitResult | null {
        // 1. Check Handles first (High priority, usually small targets)
        // Only if we expose handles. Assume we pass 'selectedPathId' contextually?
        // For now, let's just check all nodes if simpler, or we can iterate all.
        // Enterprise usually only shows handles for selected path.
        // Let's iterate all for now (simple start).

        let bestHit: HitResult | null = null;
        let bestDist = Infinity;

        // Helper to update best hit
        const tryHit = (res: HitResult) => {
            if (res.distance < bestDist && res.distance <= threshold) {
                bestDist = res.distance;
                bestHit = res;
            }
        };

        // Iterate all paths
        for (const path of paths) {
            // Check bounding box optimization
            if (!path.getBoundingBox().expand(threshold).contains(point)) {
                continue;
            }

            path.nodes.forEach((node, index) => {
                // Check Node Center
                const distNode = point.distanceTo(node.position);
                if (distNode < threshold) {
                    tryHit({
                        type: 'node',
                        pathId: path.id,
                        nodeId: node.id,
                        nodeIndex: index,
                        distance: distNode
                    });
                }

                // Check Handles (usually smaller threshold)
                // In a real app we only check handles if selected.
                // We'll check them anyway for now but maybe assume they are always visible?
                if (!node.handleIn.equals(node.position)) {
                    const distIn = point.distanceTo(node.handleIn);
                    if (distIn < handleThreshold) {
                        tryHit({
                            type: 'handle-in',
                            pathId: path.id,
                            nodeId: node.id,
                            nodeIndex: index,
                            distance: distIn
                        });
                    }
                }

                if (!node.handleOut.equals(node.position)) {
                    const distOut = point.distanceTo(node.handleOut);
                    if (distOut < handleThreshold) {
                        tryHit({
                            type: 'handle-out',
                            pathId: path.id,
                            nodeId: node.id,
                            nodeIndex: index,
                            distance: distOut
                        });
                    }
                }
            });

            // If we hit a node/handle, that wins over path segment usually.
            // But we continue to find closest.

            // Nodes usually have size ~5-10px. If we are within valid range, return immediately?
            // "Top most" vs "Closest".
            // Let's stick to closest for now.
        }

        if (bestHit) return bestHit;

        // 2. Check Paths (Segments)
        // Expensive check.
        for (const path of paths) {
            if (!path.getBoundingBox().expand(threshold).contains(point)) continue;

            const curves = path.toCurves();
            for (let i = 0; i < curves.length; i++) {
                const curve = curves[i];
                // Simple bounding box check for curve
                if (!curve.getBoundingBox().expand(threshold).contains(point)) continue;

                // Approximate distance
                // We can use a LUT of 10-20 points
                const samples = 20;
                let localBestDist = Infinity;

                // Sample points
                for (let j = 0; j <= samples; j++) {
                    const p = curve.evaluate(j / samples);
                    const d = p.distanceTo(point);
                    if (d < localBestDist) localBestDist = d;
                }

                // Refine with binary search?
                // For now LUT is okay for selection.

                if (localBestDist < threshold && localBestDist < bestDist) {
                    bestDist = localBestDist;
                    bestHit = {
                        type: 'path',
                        pathId: path.id,
                        distance: localBestDist
                    };
                }
            }
        }

        return bestHit;
    }
}
