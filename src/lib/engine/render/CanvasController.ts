import { Vector2 } from '../math/Vector2';

/**
 * Handles Canvas element, High DPI scaling, and resizing.
 */
export class CanvasController {
    readonly canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private resizeObserver: ResizeObserver | null = null;

    // Callback when resize happens (e.g., to trigger redraw)
    onResize?: (size: Vector2) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;

        this.setupResizeObserver();
        this.resize(); // Initial resize
    }

    get context(): CanvasRenderingContext2D {
        return this.ctx;
    }

    get width(): number {
        return this.canvas.width / this.dpr;
    }

    get height(): number {
        return this.canvas.height / this.dpr;
    }

    get size(): Vector2 {
        return new Vector2(this.width, this.height);
    }

    private get dpr(): number {
        return window.devicePixelRatio || 1;
    }

    private setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });

        if (this.canvas.parentElement) {
            this.resizeObserver.observe(this.canvas.parentElement);
        } else {
            // Fallback if no parent yet, though unusual for this use case
            this.resizeObserver.observe(this.canvas);
        }
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const { clientWidth, clientHeight } = parent;
        const dpr = this.dpr;

        // Set actual size in memory (scaled to account for extra pixel density)
        this.canvas.width = clientWidth * dpr;
        this.canvas.height = clientHeight * dpr;

        // Normalize coordinate system to use css pixels
        this.ctx.scale(dpr, dpr);

        // Set visible style size
        this.canvas.style.width = `${clientWidth}px`;
        this.canvas.style.height = `${clientHeight}px`;

        if (this.onResize) {
            this.onResize(new Vector2(clientWidth, clientHeight));
        }
    }

    destroy() {
        this.resizeObserver?.disconnect();
    }

    /**
     * Clears the entire canvas
     */
    clear() {
        // Clear respecting the transform? 
        // safer to clear using raw width/height and identity transform if needed, 
        // but commonly we just want to clear visible area.
        // Since we scaled the context, using correct logical width/height works.
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}
