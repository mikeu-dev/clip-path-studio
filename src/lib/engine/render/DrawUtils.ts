import { Vector2 } from '../math/Vector2';
import { CubicBezier } from '../math/Bezier';

export interface DrawStyle {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    lineDash?: number[];
    alpha?: number;
}

export class DrawUtils {
    static applyStyle(ctx: CanvasRenderingContext2D, style: DrawStyle) {
        if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
        if (style.fillStyle) ctx.fillStyle = style.fillStyle;
        if (style.lineWidth !== undefined) ctx.lineWidth = style.lineWidth;
        if (style.lineCap) ctx.lineCap = style.lineCap;
        if (style.lineJoin) ctx.lineJoin = style.lineJoin;
        if (style.lineDash) ctx.setLineDash(style.lineDash);
        if (style.alpha !== undefined) ctx.globalAlpha = style.alpha;
    }

    static resetStyle(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        // Reset common
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
    }

    static line(ctx: CanvasRenderingContext2D, from: Vector2, to: Vector2, style: DrawStyle = {}) {
        ctx.save();
        this.applyStyle(ctx, style);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }

    static circle(ctx: CanvasRenderingContext2D, center: Vector2, radius: number, style: DrawStyle = {}) {
        ctx.save();
        this.applyStyle(ctx, style);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        if (style.fillStyle) ctx.fill();
        if (style.strokeStyle) ctx.stroke();
        ctx.restore();
    }

    static polyline(ctx: CanvasRenderingContext2D, points: Vector2[], style: DrawStyle = {}, closed: boolean = false) {
        if (points.length < 2) return;
        ctx.save();
        this.applyStyle(ctx, style);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        if (closed) ctx.closePath();

        if (style.fillStyle) ctx.fill();
        if (style.strokeStyle) ctx.stroke();
        ctx.restore();
    }

    static bezier(ctx: CanvasRenderingContext2D, curve: CubicBezier, style: DrawStyle = {}) {
        ctx.save();
        this.applyStyle(ctx, style);
        ctx.beginPath();
        ctx.moveTo(curve.p0.x, curve.p0.y);
        ctx.bezierCurveTo(
            curve.p1.x, curve.p1.y,
            curve.p2.x, curve.p2.y,
            curve.p3.x, curve.p3.y
        );
        ctx.stroke();
        ctx.restore();
    }
}
