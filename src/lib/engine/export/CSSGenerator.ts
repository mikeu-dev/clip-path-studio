import { Path } from '../core/Path';
import { SVGGenerator } from './SVGGenerator';

export class CSSGenerator {
    /**
     * Generates CSS clip-path string
     */
    static toClipPath(paths: Path[], decimals: number = 2): string {
        const d = SVGGenerator.toPathData(paths, decimals);
        return `clip-path: path('${d}');`;
    }
}
