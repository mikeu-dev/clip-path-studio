import { equals, lerp, round } from './MathUtils';

export interface IPoint {
    x: number;
    y: number;
}

export class Vector2 implements IPoint {
    readonly x: number;
    readonly y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    // --- Factory Methods ---

    static get zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static get one(): Vector2 {
        return new Vector2(1, 1);
    }

    static fromObject(obj: IPoint): Vector2 {
        return new Vector2(obj.x, obj.y);
    }

    static fromArray(arr: [number, number]): Vector2 {
        return new Vector2(arr[0], arr[1]);
    }

    // --- Basic Operations ---

    add(v: Vector2 | number): Vector2 {
        if (v instanceof Vector2) {
            return new Vector2(this.x + v.x, this.y + v.y);
        }
        return new Vector2(this.x + v, this.y + v);
    }

    sub(v: Vector2 | number): Vector2 {
        if (v instanceof Vector2) {
            return new Vector2(this.x - v.x, this.y - v.y);
        }
        return new Vector2(this.x - v, this.y - v);
    }

    mul(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vector2 {
        if (scalar === 0) throw new Error("Division by zero");
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    // --- Vector Products ---

    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    cross(v: Vector2): number {
        return this.x * v.y - this.y * v.x;
    }

    // --- Geometric Properties ---

    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSq());
    }

    normalize(): Vector2 {
        const len = this.length();
        return len === 0 ? Vector2.zero : this.div(len);
    }

    distanceTo(v: Vector2): number {
        return this.sub(v).length();
    }

    distanceToSq(v: Vector2): number {
        return this.sub(v).lengthSq();
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    // --- Utilities ---

    equals(v: Vector2): boolean {
        return equals(this.x, v.x) && equals(this.y, v.y);
    }

    lerp(v: Vector2, t: number): Vector2 {
        return new Vector2(lerp(this.x, v.x, t), lerp(this.y, v.y, t));
    }

    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    round(precision: number = 3): Vector2 {
        return new Vector2(round(this.x, precision), round(this.y, precision));
    }

    toArray(): [number, number] {
        return [this.x, this.y];
    }

    toString(): string {
        return `Vector2(${this.x}, ${this.y})`;
    }
}
