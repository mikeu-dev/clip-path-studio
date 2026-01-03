import { Vector2 } from '../math/Vector2';

type PointerEventCallback = (pos: Vector2, originalEvent: PointerEvent) => void;
type WheelEventCallback = (delta: Vector2, pos: Vector2, originalEvent: WheelEvent) => void;

interface InputCallbacks {
    onDown?: PointerEventCallback;
    onMove?: PointerEventCallback;
    onUp?: PointerEventCallback;
    onWheel?: WheelEventCallback;
}

export class InputManager {
    private canvas: HTMLCanvasElement;
    private callbacks: InputCallbacks;

    // Track pointer state
    private isDragging: boolean = false;
    private lastPos: Vector2 = Vector2.zero;

    constructor(canvas: HTMLCanvasElement, callbacks: InputCallbacks) {
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.bindEvents();
    }

    private bindEvents() {
        this.canvas.addEventListener('pointerdown', this.handleDown);
        this.canvas.addEventListener('pointermove', this.handleMove);
        this.canvas.addEventListener('pointerup', this.handleUp);
        this.canvas.addEventListener('pointerleave', this.handleUp);
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

        // Disable context menu on right click to allow panning/custom context
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private getPointerPosition(e: PointerEvent | WheelEvent): Vector2 {
        const rect = this.canvas.getBoundingClientRect();

        // Screen space relative to canvas
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Return Raw Screen Space (Canvas Local)
        return new Vector2(x, y);
    }

    private handleDown = (e: PointerEvent) => {
        this.canvas.setPointerCapture(e.pointerId);
        this.isDragging = true;
        const pos = this.getPointerPosition(e);
        this.lastPos = pos;

        this.callbacks.onDown?.(pos, e);
    };

    private handleMove = (e: PointerEvent) => {
        const pos = this.getPointerPosition(e);
        this.callbacks.onMove?.(pos, e);
        this.lastPos = pos;
    };

    private handleUp = (e: PointerEvent) => {
        this.canvas.releasePointerCapture(e.pointerId);
        this.isDragging = false;
        const pos = this.getPointerPosition(e);
        this.callbacks.onUp?.(pos, e);
    };

    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const pos = this.getPointerPosition(e);
        const delta = new Vector2(e.deltaX, e.deltaY);
        this.callbacks.onWheel?.(delta, pos, e);
    };

    destroy() {
        this.canvas.removeEventListener('pointerdown', this.handleDown);
        this.canvas.removeEventListener('pointermove', this.handleMove);
        this.canvas.removeEventListener('pointerup', this.handleUp);
        this.canvas.removeEventListener('pointerleave', this.handleUp);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    }
}
