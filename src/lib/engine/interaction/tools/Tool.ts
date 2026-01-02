import { Vector2 } from '../../math/Vector2';
import { Path } from '../../core/Path';
import { EditorStore } from '$lib/stores/editor.svelte';

export interface InteractionContext {
    paths: Path[];
    setPaths(paths: Path[]): void;
    // We might need access to store to dispatch commands
    store: EditorStore;
}

export interface Tool {
    name: string;
    onDown(pos: Vector2, e: PointerEvent): void;
    onMove(pos: Vector2, e: PointerEvent): void;
    onUp(pos: Vector2, e: PointerEvent): void;
    onActivate(): void;
    onDeactivate(): void;
}
