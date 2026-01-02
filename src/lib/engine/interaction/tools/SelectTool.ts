import { Vector2 } from '../../math/Vector2';
import type { Tool, InteractionContext } from './Tool';
import { HitTest, type HitResult } from '../HitTest';
import { NodeType } from '../../core/PathNode';
import { UpdatePathCommand } from '../../commands/UpdatePathCommand';

export class SelectTool implements Tool {
    name = 'select';
    private ctx: InteractionContext;

    // Drag State
    private activeHit: HitResult | null = null;
    private dragStartPos: Vector2 | null = null;

    constructor(ctx: InteractionContext) {
        this.ctx = ctx;
    }

    onActivate() { }
    onDeactivate() {
        this.activeHit = null;
    }

    onDown(pos: Vector2, e: PointerEvent) {
        // Hit Test
        const hit = HitTest.findHit(this.ctx.paths, pos, 8);

        this.activeHit = hit;
        this.dragStartPos = pos;

        // Notify selection change
        this.ctx.store.select(hit);
    }

    onMove(pos: Vector2, e: PointerEvent) {
        if (!this.activeHit || !this.dragStartPos) return;

        const { pathId, type, nodeIndex } = this.activeHit;

        // Find Path
        const path = this.ctx.paths.find(p => p.id === pathId);
        if (!path) return;

        let newPath = path;

        // Logic Dragging
        if (type === 'node' && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            const offsetIn = node.handleIn.sub(node.position);
            const offsetOut = node.handleOut.sub(node.position);

            const newNode = node.update({
                position: pos,
                handleIn: pos.add(offsetIn),
                handleOut: pos.add(offsetOut)
            });

            newPath = path.updateNode(nodeIndex, newNode);
        }
        else if ((type === 'handle-in' || type === 'handle-out') && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            const isIn = type === 'handle-in';

            let updates: any = {
                [isIn ? 'handleIn' : 'handleOut']: pos
            };

            if (node.type === NodeType.SYMMETRIC) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                const v = pos.sub(node.position);
                updates[otherType] = node.position.sub(v);
            }
            else if (node.type === NodeType.SMOOTH) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                const otherHandle = isIn ? node.handleOut : node.handleIn;
                const currentLen = otherHandle.sub(node.position).length();
                const v = pos.sub(node.position).normalize();
                updates[otherType] = node.position.sub(v.mul(currentLen));
            }

            const newNode = node.update(updates);
            newPath = path.updateNode(nodeIndex, newNode);
        }

        // Dispatch Command?
        // For real-time dragging, we usually update local state fast, 
        // and dispatch command only on UP.
        // But for now let's just update local state to reflect in UI.
        if (newPath !== path) {
            const index = this.ctx.paths.findIndex(p => p.id === pathId);
            const newPaths = [...this.ctx.paths];
            newPaths[index] = newPath;
            this.ctx.setPaths(newPaths); // Update Engine immediately
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
