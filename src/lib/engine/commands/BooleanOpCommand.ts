import type { Command } from './Command';
import type { EditorStore } from '../../stores/editor.svelte';
import type { Path } from '../core/Path';

export class BooleanOpCommand implements Command {
    private store: EditorStore;
    private inputPaths: Path[];
    private outputPaths: Path[];

    constructor(store: EditorStore, inputPaths: Path[], outputPaths: Path[]) {
        this.store = store;
        this.inputPaths = inputPaths;
        this.outputPaths = outputPaths;
    }

    execute(): void {
        this.apply(this.inputPaths, this.outputPaths);
    }

    undo(): void {
        this.apply(this.outputPaths, this.inputPaths);
    }

    private apply(remove: Path[], add: Path[]) {
        const removeIds = new Set(remove.map(p => p.id));
        const currentPaths = this.store.paths.filter(p => !removeIds.has(p.id));

        // Add new paths
        this.store.setPaths([...currentPaths, ...add]);

        // Select new paths
        this.store.select(add.map(p => p.id));
    }
}
