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
            onDown: (p, e) => this.handleDown(p, e),
            onMove: (p, e) => this.handleMove(p, e),
            onUp: (p, e) => this.activeTool?.onUp(this.store.screenToWorld(p), e),
            onWheel: (d, p, e) => this.handleWheel(d, p, e)
        });

        // Listen to Global Key events
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.setupTools();
    }

    private isPanning = false;
    private lastPanPos = Vector2.zero;
    private isSpacePressed = false;

    private handleDown(screenPos: Vector2, e: PointerEvent) {
        // Middle Mouse or Space+Click triggers Pan
        if (e.button === 1 || this.isSpacePressed) {
            this.isPanning = true;
            this.lastPanPos = screenPos;
            return;
        }

        const worldPos = this.store.screenToWorld(screenPos);
        this.activeTool?.onDown(worldPos, e);
    }

    private handleMove(screenPos: Vector2, e: PointerEvent) {
        if (this.isPanning) {
            const delta = screenPos.sub(this.lastPanPos);
            this.store.setPan(this.store.pan.add(delta));
            this.lastPanPos = screenPos;
            return;
        }

        const worldPos = this.store.screenToWorld(screenPos);
        this.activeTool?.onMove(worldPos, e);
    }

    private handleWheel(delta: Vector2, screenPos: Vector2, e: WheelEvent) {
        // Zoom Logic
        // Zoom towards mouse pointer
        // world = (screen - pan) / zoom
        // newZoom = zoom * factor
        // We want world position under cursor to stay same.
        // screen = world * newZoom + newPan
        // world * newZoom + newPan = screen
        // newPan = screen - world * newZoom
        //        = screen - ((screen - pan) / zoom) * newZoom

        const zoomFactor = 1.1;
        const newZoom = e.deltaY > 0 ? this.store.zoom / zoomFactor : this.store.zoom * zoomFactor;

        // Clamp zoom if needed (e.g. 0.1 to 50)
        // const clampedZoom = Math.max(0.1, Math.min(50, newZoom)); 

        const worldPos = this.store.screenToWorld(screenPos);
        const newPan = screenPos.sub(worldPos.mul(newZoom));

        this.store.setZoom(newZoom);
        this.store.setPan(newPan);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) {
            this.isSpacePressed = true;
        }

        if (this.activeTool?.onKeyDown) {
            this.activeTool.onKeyDown(e);
        }
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            this.isSpacePressed = false;
            this.isPanning = false; // Stop panning if space released? Usually dragging continues until mouseup
            // Standard behavior: Space toggles Hand tool mode.
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
