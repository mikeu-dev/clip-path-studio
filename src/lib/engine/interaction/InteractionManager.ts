import { InputManager } from './InputManager';
import type { HitResult } from './HitTest';
import { Path } from '../core/Path';
import { Vector2 } from '../math/Vector2';
import type { Tool, InteractionContext } from './tools/Tool';
import { SelectTool } from './tools/SelectTool';
import { PenTool } from './tools/PenTool';
import type { EditorStore } from '../../stores/editor.svelte';

export class InteractionManager {
    private input: InputManager;
    private paths: Path[] = [];
    private store: EditorStore;

    // Tools
    private tools: Record<string, Tool> = {};
    private activeTool: Tool | null = null;

    // Callbacks
    onPathsChange?: (paths: Path[]) => void;
    onSelectionChange?: (hit: HitResult | null) => void;

    constructor(canvas: HTMLCanvasElement, store: EditorStore) {
        this.store = store;
        this.input = new InputManager(canvas, {
            onDown: (p, e) => this.activeTool?.onDown(p, e),
            onMove: (p, e) => this.activeTool?.onMove(p, e),
            onUp: (p, e) => this.activeTool?.onUp(p, e)
        });

        // Listen to Global Key events
        window.addEventListener('keydown', this.handleKeyDown);

        this.setupTools();
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        // Prevent default if tool handles it?
        // Let's pass to tool
        if (this.activeTool?.onKeyDown) {
            this.activeTool.onKeyDown(e);
        }
    }

    private setupTools() {
        // Create Context adapter
        const ctx: InteractionContext = {
            get paths() { return this.paths; }, // Bound to wrapper
            setPaths: (p) => {
                this.paths = p;
                this.onPathsChange?.(p);
            },
            store: this.store
        };
        // bind 'this' correctly for getter
        Object.defineProperty(ctx, 'paths', { get: () => this.paths });

        this.tools['select'] = new SelectTool(ctx);
        this.tools['pen'] = new PenTool(ctx);

        this.activateTool('select');
    }

    activateTool(name: string) {
        if (this.activeTool) {
            this.activeTool.onDeactivate();
        }

        const tool = this.tools[name];
        if (tool) {
            this.activeTool = tool;
            this.activeTool.onActivate();
        }
    }

    setPaths(paths: Path[]) {
        this.paths = paths;
    }

    destroy() {
        this.input.destroy();
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
