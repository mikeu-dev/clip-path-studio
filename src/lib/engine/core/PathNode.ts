import { Vector2 } from '../math/Vector2';

export enum NodeType {
    CORNER = 'corner',       // Handles are independent
    SMOOTH = 'smooth',       // Handles are collinear, length independent
    SYMMETRIC = 'symmetric'  // Handles are collinear and equal length
}

/**
 * Raw data structure for JSON serialization
 */
export interface IPathNodeData {
    id: string;
    x: number;
    y: number;
    inX?: number; // Relative or Absolute? Let's use Absolute for storage simplicity, convert to relative if needed for UI
    inY?: number;
    outX?: number;
    outY?: number;
    type: NodeType;
}

export class PathNode {
    readonly id: string;
    readonly position: Vector2;
    readonly handleIn: Vector2;  // Absolute position
    readonly handleOut: Vector2; // Absolute position
    readonly type: NodeType;

    constructor(
        position: Vector2,
        handleIn: Vector2 = position,
        handleOut: Vector2 = position,
        type: NodeType = NodeType.CORNER,
        id: string = crypto.randomUUID()
    ) {
        this.position = position;
        this.handleIn = handleIn;
        this.handleOut = handleOut;
        this.type = type;
        this.id = id;
    }

    /**
     * Create a corner node with no handles (handles at position)
     */
    static corner(x: number, y: number): PathNode {
        const pos = new Vector2(x, y);
        return new PathNode(pos, pos, pos, NodeType.CORNER);
    }

    /**
     * Clone with modified properties (Immutable update)
     */
    update(props: Partial<{ position: Vector2; handleIn: Vector2; handleOut: Vector2; type: NodeType }>): PathNode {
        return new PathNode(
            props.position ?? this.position,
            props.handleIn ?? this.handleIn,
            props.handleOut ?? this.handleOut,
            props.type ?? this.type,
            this.id
        );
    }

    toJSON(): IPathNodeData {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            inX: this.handleIn.equals(this.position) ? undefined : this.handleIn.x,
            inY: this.handleIn.equals(this.position) ? undefined : this.handleIn.y,
            outX: this.handleOut.equals(this.position) ? undefined : this.handleOut.x,
            outY: this.handleOut.equals(this.position) ? undefined : this.handleOut.y,
            type: this.type
        };
    }

    static fromJSON(data: IPathNodeData): PathNode {
        const pos = new Vector2(data.x, data.y);
        const hIn = (data.inX !== undefined && data.inY !== undefined)
            ? new Vector2(data.inX, data.inY)
            : pos;
        const hOut = (data.outX !== undefined && data.outY !== undefined)
            ? new Vector2(data.outX, data.outY)
            : pos;

        return new PathNode(pos, hIn, hOut, data.type, data.id);
    }
}
