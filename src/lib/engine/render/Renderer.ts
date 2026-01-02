import { CanvasController } from './CanvasController';
import { DrawUtils } from './DrawUtils';
import { Vector2 } from '../math/Vector2';
import { Matrix3 } from '../math/Matrix3';
import { Path } from '../core/Path';

export class Renderer {
    private controller: CanvasController;
    private paths: Path[] = [];
    private transform: Matrix3 = Matrix3.identity;
    private dirty: boolean = true;
    private animationFrameId: number | null = null;

    // Theme configuration (could be moved to separate file)
    private colors = {
        background: '#1e1e1e',
        grid: '#333333',
        axis: '#444444',
        pathStroke: '#00ccff',
        nodeFill: '#ffffff',
        nodeStroke: '#00ccff',
        handleLine: '#666666',
        handleFill: '#ff0055'
    };

    constructor(canvas: HTMLCanvasElement) {
        this.controller = new CanvasController(canvas);

        // Auto-redraw on resize
        this.controller.onResize = () => {
            this.requestRender();
        };

        this.startLoop();
    }

    setPaths(paths: Path[]) {
        this.paths = paths;
        this.requestRender();
    }

    setTransform(matrix: Matrix3) {
        this.transform = matrix;
        this.requestRender();
    }

    /**
     * Mark as dirty to trigger render next frame
     */
    requestRender() {
        this.dirty = true;
    }

    startLoop() {
        const loop = () => {
            if (this.dirty) {
                this.render();
                this.dirty = false;
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private render() {
        const ctx = this.controller.context;
        const { width, height } = this.controller;

        // 1. Clear
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, width, height);

        ctx.save();

        // 2. Apply Scene Transform
        // Matrix3 is row-major components [m00 m01 m02...].
        // Canvas setTransform takes (a, b, c, d, e, f) -> col-major 2x3 affine.
        // x' = ax + cy + e
        // y' = bx + dy + f
        // Our Matrix3:
        // x' = m00*x + m01*y + m02
        // y' = m10*x + m11*y + m12
        // So mapping: a=m00, c=m01, e=m02
        //             b=m10, d=m11, f=m12
        const t = this.transform.elements;
        ctx.setTransform(t[0], t[3], t[1], t[4], t[2], t[5]);

        // 3. Draw Grid (simplified infinite grid approx)
        this.drawGrid(ctx);

        // 4. Draw Paths
        for (const path of this.paths) {
            ctx.save();

            // Apply Path Transform (Multiply on top of Scene Transform)
            // ctx.transform(a, b, c, d, e, f)
            // a=m00, c=m01, e=m02
            // b=m10, d=m11, f=m12
            const pt = path.transform.elements;
            ctx.transform(pt[0], pt[3], pt[1], pt[4], pt[2], pt[5]);

            this.drawPath(ctx, path);
            this.drawHandles(ctx, path); // Only if selected usually, but draw all for now

            ctx.restore();
        }

        ctx.restore();
    }

    private drawGrid(ctx: CanvasRenderingContext2D) {
        // Need inverse transform to know visible bounds in world space?
        // For now, simpler fixed grid near origin
        const size = 2000;
        const step = 50;

        ctx.beginPath();
        // Verticals
        for (let x = -size; x <= size; x += step) {
            ctx.moveTo(x, -size);
            ctx.lineTo(x, size);
        }
        // Horizontals
        for (let y = -size; y <= size; y += step) {
            ctx.moveTo(-size, y);
            ctx.lineTo(size, y);
        }

        DrawUtils.applyStyle(ctx, {
            strokeStyle: this.colors.grid,
            lineWidth: 1
        });
        ctx.stroke();

        // Axes
        DrawUtils.line(ctx, new Vector2(-size, 0), new Vector2(size, 0), { strokeStyle: this.colors.axis, lineWidth: 2 });
        DrawUtils.line(ctx, new Vector2(0, -size), new Vector2(0, size), { strokeStyle: this.colors.axis, lineWidth: 2 });
    }

    private drawPath(ctx: CanvasRenderingContext2D, path: Path) {
        const curves = path.toCurves();
        for (const curve of curves) {
            DrawUtils.bezier(ctx, curve, {
                strokeStyle: this.colors.pathStroke,
                lineWidth: 2
            });
        }
    }

    private drawHandles(ctx: CanvasRenderingContext2D, path: Path) {
        // Draw nodes and handles
        const nodeSize = 4;
        const handleSize = 3;

        for (const node of path.nodes) {
            // Handles Lines
            if (!node.handleIn.equals(node.position)) {
                DrawUtils.line(ctx, node.handleIn, node.position, { strokeStyle: this.colors.handleLine, lineWidth: 1 });
                DrawUtils.circle(ctx, node.handleIn, handleSize, { fillStyle: this.colors.handleFill });
            }
            if (!node.handleOut.equals(node.position)) {
                DrawUtils.line(ctx, node.position, node.handleOut, { strokeStyle: this.colors.handleLine, lineWidth: 1 });
                DrawUtils.circle(ctx, node.handleOut, handleSize, { fillStyle: this.colors.handleFill });
            }

            // Node Center
            DrawUtils.circle(ctx, node.position, nodeSize, {
                fillStyle: this.colors.nodeFill,
                strokeStyle: this.colors.nodeStroke,
                lineWidth: 1
            });
        }
    }

    destroy() {
        this.stopLoop();
        this.controller.destroy();
    }
}
