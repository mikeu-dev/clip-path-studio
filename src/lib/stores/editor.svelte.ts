import { Path } from '../engine/core/Path';
import { CommandHistory, type Command } from '../engine/commands/Command';
import type { HitResult } from '../engine/interaction/HitTest';

export class EditorStore {
    paths = $state<Path[]>([]);
    selection = $state<HitResult | null>(null);

    // Undo/Redo status exposed as reactive properties
    canUndo = $state(false);
    canRedo = $state(false);

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
}

// Context key for Symbol safety
export const EDITOR_KEY = Symbol('EDITOR');
