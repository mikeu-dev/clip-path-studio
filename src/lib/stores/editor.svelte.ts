import { Path } from '../engine/core/Path';
import { Vector2 } from '../engine/math/Vector2';
import { CommandHistory, type Command } from '../engine/commands/Command';
import type { HitResult } from '../engine/interaction/HitTest';

export class EditorStore {
    paths = $state<Path[]>([]);
    selection = $state<HitResult | null>(null); // Active element (for node editing/dragging)
    selectedPathIds = $state(new Set<string>()); // Multi-selection for boolean ops/layers

    // Undo/Redo status exposed as reactive properties
    canUndo = $state(false);
    canRedo = $state(false);

    // Viewport state
    pan = $state(Vector2.zero);
    zoom = $state(1);

    // Tool state
    activeTool = $state('select');

    readonly history: CommandHistory;

    constructor() {
        this.history = new CommandHistory();
        this.history.onChange = () => {
            this.canUndo = this.history.canUndo;
            this.canRedo = this.history.canRedo;
        };
    }

    // --- Actions ---

    execute(command: Command) {
        this.history.execute(command);
    }

    undo() {
        this.history.undo();
    }

    redo() {
        this.history.redo();
    }

    setPaths(newPaths: Path[]) {
        this.paths = newPaths;
    }

    addPath(path: Path) {
        this.paths = [...this.paths, path];
    }

    select(hit: HitResult | null, add: boolean = false) {
        this.selection = hit;

        if (!add) {
            this.selectedPathIds = new Set();
        }

        if (hit) {
            this.selectedPathIds.add(hit.pathId);
            // Re-assign to trigger reactivity if needed (Svelte 5 Set reactivity is usually fine via method, but let's be safe)
            this.selectedPathIds = new Set(this.selectedPathIds);
        }
    }

    selectPaths(ids: string[]) {
        this.selectedPathIds = new Set(ids);
        this.selection = null; // Clear active hit
    }

    setTool(toolName: string) {
        this.activeTool = toolName;
    }

    // --- Viewport Actions ---

    // --- Actions ---

    performBooleanOp(op: 'union' | 'subtract') {
        const selectedIds = Array.from(this.selectedPathIds);
        if (selectedIds.length !== 2) return;

        const pathA = this.paths.find(p => p.id === selectedIds[0]);
        const pathB = this.paths.find(p => p.id === selectedIds[1]);

        if (!pathA || !pathB) return;

        // Perform op
        // Note: For subtract, order matters. We use selection order or just S[0] - S[1].
        // Ideally UI allows swapping or specific targeting.
        // For now, let's assume S[0] is target, S[1] is tool? Or creation order?
        // Let's use array order.

        // Lazy load module to avoid circular deps if any (though BooleanOps fits here)
        import('../engine/math/BooleanOps').then(({ BooleanOps }) => {
            let result: import('../engine/core/Path').Path[] = [];
            if (op === 'union') {
                result = BooleanOps.union(pathA, pathB);
            } else {
                result = BooleanOps.subtract(pathA, pathB);
            }

            if (result.length > 0) {
                // Import command
                import('../engine/commands/BooleanOpCommand').then(({ BooleanOpCommand }) => {
                    this.execute(new BooleanOpCommand(this, [pathA, pathB], result));
                });
            }
        });
    }

    setPan(pan: Vector2) {
        this.pan = pan;
    }

    setZoom(zoom: number) {
        this.zoom = zoom;
    }

    // --- Coordinate Helpers ---

    screenToWorld(screenPos: Vector2): Vector2 {
        // world = (screen - pan) / zoom
        return screenPos.sub(this.pan).div(this.zoom);
    }

    worldToScreen(worldPos: Vector2): Vector2 {
        // screen = world * zoom + pan
        return worldPos.mul(this.zoom).add(this.pan);
    }
}

// Context key for Symbol safety
export const EDITOR_KEY = Symbol('EDITOR');
