import { Path } from '../engine/core/Path';
import { Vector2 } from '../engine/math/Vector2';
import { CommandHistory, type Command } from '../engine/commands/Command';
import type { HitResult } from '../engine/interaction/HitTest';

export class EditorStore {
    paths = $state<Path[]>([]);
    selection = $state<HitResult | null>(null);

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
        // Direct mutation for now? No, use explicit command if we want undo.
        // But for initial loading/setup we might just set.
        this.paths = [...this.paths, path];
    }

    select(hit: HitResult | null) {
        this.selection = hit;
    }

    setTool(toolName: string) {
        this.activeTool = toolName;
    }

    // --- Viewport Actions ---

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
