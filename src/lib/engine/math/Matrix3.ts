import { Vector2 } from './Vector2';
import { round } from './MathUtils';

/**
 * Represents a 3x3 Matrix for 2D Affine Transformations.
 * Store as row-major array for readability:
 * [ m00, m01, m02 ]
 * [ m10, m11, m12 ]
 * [ m20, m21, m22 ]
 *
 * For Affine transform:
 * x' = m00*x + m01*y + m02
 * y' = m10*x + m11*y + m12
 */
export class Matrix3 {
    elements: Float32Array; // or number[]

    constructor(
        n11: number, n12: number, n13: number,
        n21: number, n22: number, n23: number,
        n31: number, n32: number, n33: number
    ) {
        this.elements = new Float32Array([
            n11, n12, n13,
            n21, n22, n23,
            n31, n32, n33
        ]);
    }

    static get identity(): Matrix3 {
        return new Matrix3(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        );
    }

    // Multiply this matrix by another matrix (A * B)
    multiply(m: Matrix3): Matrix3 {
        const a = this.elements;
        const b = m.elements;

        return new Matrix3(
            a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
        );
    }

    // Transform a point (Vector2)
    transformPoint(v: Vector2): Vector2 {
        const e = this.elements;
        const x = v.x;
        const y = v.y;
        // For affine, we assume w=1.
        // x' = m00*x + m01*y + m02
        // y' = m10*x + m11*y + m12
        const nx = e[0] * x + e[1] * y + e[2];
        const ny = e[3] * x + e[4] * y + e[5];
        return new Vector2(nx, ny);
    }

    // --- Factory Factories ---

    static translate(x: number, y: number): Matrix3 {
        return new Matrix3(
            1, 0, x,
            0, 1, y,
            0, 0, 1
        );
    }

    static scale(sx: number, sy: number): Matrix3 {
        return new Matrix3(
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        );
    }

    static rotate(radians: number): Matrix3 {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        return new Matrix3(
            c, -s, 0,
            s, c, 0,
            0, 0, 1
        );
    }

    /**
     * Calculate exact inverse.
     * For general 3x3.
     */
    inverse(): Matrix3 {
        const te = this.elements;
        const n11 = te[0], n12 = te[1], n13 = te[2];
        const n21 = te[3], n22 = te[4], n23 = te[5];
        const n31 = te[6], n32 = te[7], n33 = te[8];

        const t11 = n33 * n22 - n32 * n23;
        const t12 = n32 * n13 - n33 * n12;
        const t13 = n23 * n12 - n22 * n13;

        const det = n11 * t11 + n21 * t12 + n31 * t13;

        if (det === 0) {
            console.warn("Matrix3.inverse: Singular matrix, returning identity.");
            return Matrix3.identity;
        }

        const detInv = 1 / det;

        // Inverting Row-Major matrix
        // m00, m01, m02
        // m10, m11, m12
        // m20, m21, m22

        // Adj elements
        // A00 = t11
        // A10 = t12
        // A20 = t13

        return new Matrix3(
            // Row 0
            t11 * detInv,    // m00 = C00
            t12 * detInv,    // m01 = C10 (Inv 0,1 comes from Cofactor 1,0)
            t13 * detInv,    // m02 = C20 (Inv 0,2 comes from Cofactor 2,0)

            // Row 1
            (n31 * n23 - n33 * n21) * detInv, // m10 = C01
            (n33 * n11 - n31 * n13) * detInv, // m11 = C11
            (n21 * n13 - n23 * n11) * detInv, // m12 = C21

            // Row 2
            (n32 * n21 - n31 * n22) * detInv, // m20 = C02
            (n31 * n12 - n32 * n11) * detInv, // m21 = C12
            (n22 * n11 - n21 * n12) * detInv  // m22 = C22
        );
    }

    clone(): Matrix3 {
        const e = this.elements;
        return new Matrix3(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]);
    }

    toString(): string {
        const e = this.elements;
        return `Matrix3[${e.join(', ')}]`;
    }
}
