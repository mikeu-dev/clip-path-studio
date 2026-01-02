import { Vector2 } from '../../math/Vector2';
import type { Tool, InteractionContext } from './Tool';
import { Path } from '../../core/Path';
import { PathNode, NodeType } from '../../core/PathNode';
import { HitTest } from '../HitTest';

export class PenTool implements Tool {
    name = 'pen';
    private ctx: InteractionContext;

    // State for creating new path
    private activePathId: string | null = null;
    private isDragging: boolean = false;
    private dragStartPos: Vector2 | null = null;

    constructor(ctx: InteractionContext) {
        this.ctx = ctx;
    }

    onActivate() {
        this.activePathId = null;
    }

    onDeactivate() {
        this.activePathId = null;
    }

    onDown(pos: Vector2, e: PointerEvent) {
        // 1. Check if we hit start point of active path -> Close Path
        if (this.activePathId) {
            const path = this.ctx.paths.find(p => p.id === this.activePathId);
            if (path && path.length > 0) {
                const startNode = path.nodes[0];
                if (pos.distanceTo(startNode.position) < 10) {
                    // Close path
                    const closedPath = path.setClosed(true);
                    this.updatePath(closedPath);
                    this.activePathId = null; // Done
                    return;
                }
            }
        }

        // 2. Start new path if none active
        if (!this.activePathId) {
            const newNode = PathNode.corner(pos.x, pos.y);
            const newPath = new Path([newNode]);

            // Add to context
            const newPaths = [...this.ctx.paths, newPath];
            this.ctx.setPaths(newPaths);
            this.activePathId = newPath.id;

            // Select the new node? 
            // Logic to track active interaction
        } else {
            // 3. Add node to active path
            const path = this.ctx.paths.find(p => p.id === this.activePathId);
            if (path) {
                const newNode = PathNode.corner(pos.x, pos.y);
                const newPath = path.addNode(newNode);
                this.updatePath(newPath);
            }
        }

        this.isDragging = true;
        this.dragStartPos = pos;
    }

    onMove(pos: Vector2, e: PointerEvent) {
        if (this.isDragging && this.activePathId && this.dragStartPos) {
            // Dragging after placing point -> Adjust handles (make it Smooth)
            const path = this.ctx.paths.find(p => p.id === this.activePathId);
            if (!path) return;

            // The last node added is the one we are modifying
            const index = path.length - 1;
            const node = path.nodes[index];

            // Calculate handle out based on drag
            // If we drag away from point, that usually defines handle out direction?
            // "Pull out" handles.
            // Illustrator style: Dragging moves Handle Out in direction of mouse, 
            // and Handle In symmetrically opposite.

            const v = pos.sub(node.position);

            const newNode = node.update({
                type: NodeType.SYMMETRIC,
                handleOut: node.position.add(v),
                handleIn: node.position.sub(v)
            });

            const newPath = path.updateNode(index, newNode);
            this.updatePath(newPath);
        }
    }

    onUp(pos: Vector2, e: PointerEvent) {
        this.isDragging = false;
        this.dragStartPos = null;
    }

    private updatePath(newPath: Path) {
        const index = this.ctx.paths.findIndex(p => p.id === newPath.id);
        if (index !== -1) {
            const newPaths = [...this.ctx.paths];
            newPaths[index] = newPath;
            this.ctx.setPaths(newPaths);
        }
    }
}
