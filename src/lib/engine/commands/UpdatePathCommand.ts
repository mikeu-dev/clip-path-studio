import type { Command } from './Command';
import type { EditorStore } from '../../stores/editor.svelte';
import { Path } from '../core/Path';

export class UpdatePathCommand implements Command {
    private store: EditorStore;
    private oldPath: Path;
    private newPath: Path;

    constructor(store: EditorStore, oldPath: Path, newPath: Path) {
        this.store = store;
        this.oldPath = oldPath;
        this.newPath = newPath;
    }

    execute(): void {
        this.apply(this.newPath);
    }

    undo(): void {
        this.apply(this.oldPath);
    }

    private apply(path: Path) {
        const index = this.store.paths.findIndex(p => p.id === path.id);
        if (index !== -1) {
            // Immutable update of the array
            const newPaths = [...this.store.paths];
            newPaths[index] = path;
            this.store.setPaths(newPaths);
        }
    }
}
