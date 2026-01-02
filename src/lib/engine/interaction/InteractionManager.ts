import { InputManager } from './InputManager';
import type { HitResult } from './HitTest';
import { HitTest } from './HitTest';
import { Path } from '../core/Path';
import { Vector2 } from '../math/Vector2';
import { NodeType } from '../core/PathNode';

export class InteractionManager {
    private input: InputManager;
    private paths: Path[] = [];

    // State
    private activeHit: HitResult | null = null;
    private dragStartPos: Vector2 | null = null;
    private initialDragState: any = null; // Store snapshot before drag

    // Callbacks
    onPathsChange?: (paths: Path[]) => void;
    onSelectionChange?: (hit: HitResult | null) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.input = new InputManager(canvas, {
            onDown: this.handleDown.bind(this),
            onMove: this.handleMove.bind(this),
            onUp: this.handleUp.bind(this)
        });
    }

    setPaths(paths: Path[]) {
        this.paths = paths;
    }

    destroy() {
        this.input.destroy();
    }

    private handleDown(pos: Vector2, e: PointerEvent) {
        // Simple hit test
        const hit = HitTest.findHit(this.paths, pos, 8); // 8px threshold

        this.activeHit = hit;
        this.dragStartPos = pos;
        this.onSelectionChange?.(hit);

        if (hit) {
            // Snapshot state for undo? Or just for delta calculation?
            // For simple dragging: just track delta from current pos
        }
    }

    private handleMove(pos: Vector2, e: PointerEvent) {
        if (!this.activeHit || !this.dragStartPos) return;

        const delta = pos.sub(this.dragStartPos!);

        // This is where "Immutable State" becomes tricky in a loop.
        // If we update path, we get NEW path object.
        // If we keep dragging, we need to apply delta to the ORIGINAL position at start of drag?
        // OR apply delta to "current" position? InputManager gives absolute pos.
        // Absolute pos is easier: node.position = mousePos.

        const { pathId, type, nodeIndex } = this.activeHit;

        // Find the path to update
        const pathIdx = this.paths.findIndex(p => p.id === pathId);
        if (pathIdx === -1) return;

        const path = this.paths[pathIdx];

        let newPath = path;

        if (type === 'node' && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            // Move Node AND its handles (maintain relative offset)
            const offsetIn = node.handleIn.sub(node.position);
            const offsetOut = node.handleOut.sub(node.position);

            const newPos = pos; // Snap to grid?

            const newNode = node.update({
                position: newPos,
                handleIn: newPos.add(offsetIn),
                handleOut: newPos.add(offsetOut)
            });

            newPath = path.updateNode(nodeIndex, newNode);
        }
        else if ((type === 'handle-in' || type === 'handle-out') && nodeIndex !== undefined) {
            const node = path.nodes[nodeIndex];
            const isIn = type === 'handle-in';

            // Update the handle being dragged
            let updates: any = {
                [isIn ? 'handleIn' : 'handleOut']: pos
            };

            // Handle Symmetric/Smooth logic here
            // If symmetric, the other handle mirrors
            if (node.type === NodeType.SYMMETRIC) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                // Vector from node to handle
                const v = pos.sub(node.position);
                // Other handle is -v
                updates[otherType] = node.position.sub(v);
            }
            else if (node.type === NodeType.SMOOTH) {
                const otherType = isIn ? 'handleOut' : 'handleIn';
                const otherHandle = isIn ? node.handleOut : node.handleIn;
                const currentLen = otherHandle.sub(node.position).length();

                // Normalize current direction
                const v = pos.sub(node.position).normalize();
                // Other side points opposite
                updates[otherType] = node.position.sub(v.mul(currentLen));
            }

            const newNode = node.update(updates);
            newPath = path.updateNode(nodeIndex, newNode);
        }

        // Apply update
        if (newPath !== path) {
            const newPaths = [...this.paths];
            newPaths[pathIdx] = newPath;
            this.paths = newPaths; // Optimistic local update
            this.onPathsChange?.(newPaths); // Notify app
        }
    }

    private handleUp(pos: Vector2, e: PointerEvent) {
        this.activeHit = null;
        this.dragStartPos = null;
    }
}
