import { Path } from '../core/Path';
import { round } from '../math/MathUtils';

export class SVGGenerator {
    /**
     * Generates SVG path data string ("M ... C ... Z")
     * @param paths List of Path objects
     * @param decimals Number of decimal places
     */
    static toPathData(paths: Path[], decimals: number = 2): string {
        let d = '';

        for (const path of paths) {
            if (path.length === 0) continue;

            const curves = path.toCurves();
            if (curves.length === 0) continue;

            // Move to start
            const start = curves[0].p0;
            d += `M ${round(start.x, decimals)} ${round(start.y, decimals)}`;

            for (const curve of curves) {
                // Cubic Bezier: C hp1x hp1y, hp2x hp2y, p2x p2y
                d += ` C ${round(curve.p1.x, decimals)} ${round(curve.p1.y, decimals)}, ${round(curve.p2.x, decimals)} ${round(curve.p2.y, decimals)}, ${round(curve.p3.x, decimals)} ${round(curve.p3.y, decimals)}`;
            }

            if (path.closed) {
                d += ' Z';
            }
        }

        return d.trim();
    }

    /**
     * Generates a full SVG string
     */
    static toSVGString(paths: Path[], width: number = 800, height: number = 600): string {
        const pathElements = paths.map(path => {
            const d = this.toPathData([path]); // Use helper for single path
            return `  <path d="${d}" fill="none" stroke="black" stroke-width="1"/>`;
        }).join('\n');

        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g>
${pathElements}
  </g>
</svg>`;
    }
}
