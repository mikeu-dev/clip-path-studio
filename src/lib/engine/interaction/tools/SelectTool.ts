import { Vector2 } from '../../math/Vector2';
import type { Tool, InteractionContext } from './Tool';
import { NodeType, PathNode } from '../../core/PathNode'; // Import PathNode class
import { Path } from '../../core/Path';
import { UpdatePathCommand } from '../../commands/UpdatePathCommand';
import { HitTest, type HitResult } from '../HitTest';

export class SelectTool implements Tool {
    name = 'select';
    private ctx: InteractionContext;

    // Double click state
    private lastClickTime: number = 0;
    private lastClickPos: Vector2 | null = null;

    // Drag State (Restored)
    private activeHit: HitResult | null = null;
    private dragStartPos: Vector2 | null = null;

    constructor(ctx: InteractionContext) {
        this.ctx = ctx;
    }

    onActivate() { }
    onDeactivate() {
        this.activeHit = null;
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const sel = this.ctx.store.selection;
            if (sel && sel.type === 'node' && sel.nodeIndex !== undefined) {
                const path = this.ctx.paths.find(p => p.id === sel.pathId);
                if (path && path.length > 2) { // Don't delete if < 2 nodes or it becomes point?
                    // Logic: Remove node.
                    // const newPath = path.removeNode(node.id); // Oops removeNode needs ID
                    const node = path.nodes[sel.nodeIndex];
                    const newPath = path.removeNode(node.id);

                    // Update store
                    const index = this.ctx.paths.findIndex(p => p.id === path.id);
                    const newPaths = [...this.ctx.paths];
                    if (newPath.length < 2) {
                        // Remove path entirely if too small?
                        newPaths.splice(index, 1);
                        this.ctx.store.select(null);
                    } else {
                        newPaths[index] = newPath;
                        this.ctx.store.select(null); // Clear selection after delete
                    }

                    this.ctx.setPaths(newPaths);
                }
            }
        }
    }

    onDown(pos: Vector2, e: PointerEvent) {
        // Hit Test
        // Threshold should be adjusted by scale? Ideally yes, but constant screen px is fine if we transform nodes to world.
        const hit = HitTest.findHit(this.ctx.paths, pos, 8);

        // Double Click Detection
        const now = Date.now();
        const isDoubleClick = (now - this.lastClickTime < 300) && this.lastClickPos && pos.distanceTo(this.lastClickPos) < 5;
        this.lastClickTime = now;
        this.lastClickPos = pos;

        if (isDoubleClick && hit && hit.type === 'path' && hit.segmentIndex !== undefined && hit.t !== undefined) {
            // INSERT NODE Logic
            this.handleInsertNode(hit);
            return;
        }

        this.activeHit = hit;
        this.dragStartPos = pos;

        // Notify selection change
        this.ctx.store.select(hit);
    }

    private handleInsertNode(hit: HitResult) {
        if (!hit.segmentIndex && hit.segmentIndex !== 0) return;
        const path = this.ctx.paths.find(p => p.id === hit.pathId);
        if (!path) return;

        const i = hit.segmentIndex!;
        const iNext = (i + 1) % path.nodes.length;

        // Get curves (in local space)
        const curves = path.toCurves();
        if (i >= curves.length) return;

        const curve = curves[i];
        const [left, right] = curve.split(hit.t!); // t is verified

        // Create New Node
        // Left curve ends at split point. Right curve starts at split point.
        // New Node Position = left.p3 (or right.p0)
        // New Node HandleIn = left.p2
        // New Node HandleOut = right.p1

        // Also update Prev Node (HandleOut = left.p1)
        // And Next Node (HandleIn = right.p2)

        // Create New Node
        const newNode = new PathNode(
            right.p0,          // Position
            left.p2, // HandleIn (control 2 of left)
            right.p1,   // HandleOut (control 1 of right)
            NodeType.SMOOTH
        );
        // Wait, PathNode constructor: (pos, handleIn, handleOut, type)
        // Splitting: 
        // Curve: P0 (start), P1 (startH), P2 (endH), P3 (end)
        // Split Left: P0, P01, P012, P0123
        // Split Right: P0123, P123, P23, P3
        // New Node is P0123.
        // HandleIn for NewNode is P012.
        // HandleOut for NewNode is P123.
        // HandleOut for PrevNode becomes P01.
        // HandleIn for NextNode becomes P23.

        const prevNode = path.nodes[i];
        const nextNode = path.nodes[iNext]; // Handles closed path wrap

        // We need to update prev/next node handles as well.
        // This 'insertNode' method on Path class just inserts. It doesn't adjust neighbors.
        // We need 'splitSegment' method on Path? Or manual update.
        // Manual update:
        const updatedPrev = prevNode.update({ handleOut: left.p1 }); // p1 of left
        const updatedNext = nextNode.update({ handleIn: right.p2 }); // p2 of right

        // Construct new node list
        const newNodes = [...path.nodes];
        newNodes[i] = updatedPrev;
        newNodes[iNext] = updatedNext;
        newNodes.splice(i + 1, 0, newNode);

        // Create new path
        // Careful with closed path: if iNext is 0, we inserted at end, index is length.

        // Let's rely on splicing.
        // If iNext == 0 (wrap), then NextNode is at index 0. We update it. 
        // We insert new node at index i+1.
        // Correct.

        const newPath = new Path(newNodes, path.closed, path.transform, path.id);

        // Update Store
        const pathIdx = this.ctx.paths.findIndex(p => p.id === path.id);
        const allPaths = [...this.ctx.paths];
        allPaths[pathIdx] = newPath;
        this.ctx.setPaths(allPaths);

        // Select new node
        this.ctx.store.select({
            type: 'node',
            pathId: path.id,
            nodeIndex: i + 1,
            distance: 0,
            nodeId: newNode.id
        });
    }

    onMove(pos: Vector2, e: PointerEvent) {
        if (!this.activeHit || !this.dragStartPos) return;

        const { pathId, type, nodeIndex } = this.activeHit;

        const path = this.ctx.paths.find(p => p.id === pathId);
        if (!path) return;

        // Transform Mouse Pos to Local Space
        // We need inverse transform.
        const invMatrix = path.transform.inverse();
        const localPos = invMatrix.transformPoint(pos);

        let newPath = path;

        // Logic Dragging
        if (type === 'node' && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            // Delta in local space?
            // Actually simpler: just set position to localPos.
            // But we want relative drag usually to avoid snapping center to mouse.
            // Let's set position to localPos for direct control (like Pen tool).
            // Or better: maintain offset.

            // For dragging nodes, direct mapping is fine and expected (node center under mouse).
            // But handles move relative.

            // NOTE: offset calculation
            // const offset = localPos - node.position (if we started exactly on node)
            // But dragStartPos was world.
            // Simplest: `node.update({ position: localPos })`.
            // BUT handles need to move with it.

            const delta = localPos.sub(node.position); // This snaps if we aren't careful on first frame
            // To prevent snap: calculate delta from 'previous local pos'.
            // But `onMove` gives absolute pos.

            // Let's just use absolute localPos as target. Snapping to center of mouse is standard behavior for tools.
            const offsetIn = node.handleIn.sub(node.position);
            const offsetOut = node.handleOut.sub(node.position);

            const newNode = node.update({
                position: localPos,
                handleIn: localPos.add(offsetIn),
                handleOut: localPos.add(offsetOut)
            });

            newPath = path.updateNode(nodeIndex, newNode);
        }
        else if ((type === 'handle-in' || type === 'handle-out') && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            const isIn = type === 'handle-in';

            let updates: any = {
                [isIn ? 'handleIn' : 'handleOut']: localPos
            };

            if (node.type === NodeType.SYMMETRIC) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                // Vector from node to handle
                const v = localPos.sub(node.position);
                // Mirror
                updates[otherType] = node.position.sub(v);
            }
            else if (node.type === NodeType.SMOOTH) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                const otherHandle = isIn ? node.handleOut : node.handleIn;
                const currentLen = otherHandle.sub(node.position).length();
                const v = localPos.sub(node.position).normalize();
                updates[otherType] = node.position.sub(v.mul(currentLen));
            }

            const newNode = node.update(updates);
            newPath = path.updateNode(nodeIndex, newNode);
        }

        if (newPath !== path) {
            const index = this.ctx.paths.findIndex(p => p.id === pathId);
            const newPaths = [...this.ctx.paths];
            newPaths[index] = newPath;
            this.ctx.setPaths(newPaths);
        }
    }

    onUp(pos: Vector2, e: PointerEvent) {
        if (this.activeHit && this.dragStartPos) {
            // Commit change to history if moved?
            // Logic needed: snapshot before drag, commit command after drag.
            // Implemented simply: we assume store already has new data from setPaths calls?
            // No, context.setPaths updates engine (and store if linked). 
            // Ideally:
            // 1. On Down: capture 'oldPath'
            // 2. On Move: update 'currentPath' (visuals)
            // 3. On Up: Dispatch UpdatePathCommand(oldPath, currentPath)

            // Let's implement that proper undo pattern later
            // For now, clear state.
        }

        this.activeHit = null;
        this.dragStartPos = null;
    }
}
