import { Path } from '../core/Path';
import { PathNode, NodeType } from '../core/PathNode';
import { Vector2 } from '../math/Vector2';

export class SVGParser {
    /**
     * Parses an SVG path data string into an array of Path objects.
     * Currently supports absolute M, L, C, Z commands.
     */
    static parse(d: string): Path[] {
        const paths: Path[] = [];
        const commands = d.match(/([a-zA-Z])|([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g);

        if (!commands) return [];

        let currentPathNodes: PathNode[] = [];
        let currentPathClosed = false;

        let i = 0;
        let currentPos = new Vector2(0, 0);
        let startPos = new Vector2(0, 0);

        const flushPath = () => {
            if (currentPathNodes.length > 0) {
                // If closed, the last node might duplicate the first? 
                // In our structure, we just mark flag.
                // SVG 'Z' draws line to start.
                paths.push(new Path(currentPathNodes, currentPathClosed));
                currentPathNodes = [];
                currentPathClosed = false;
            }
        };

        while (i < commands.length) {
            const cmd = commands[i];
            i++;

            // If it's a number, it's a continuation of previous command (implicit)
            // But we'll assume standard structure of CMD [args]...

            // Check for command letter
            if (/[a-zA-Z]/.test(cmd)) {
                switch (cmd) {
                    case 'M': {
                        flushPath(); // Start new path
                        const x = parseFloat(commands[i++]);
                        const y = parseFloat(commands[i++]);
                        const pos = new Vector2(x, y);
                        currentPathNodes.push(new PathNode(pos, pos, pos, NodeType.CORNER));
                        currentPos = pos;
                        startPos = pos;
                        break;
                    }
                    case 'L': {
                        const x = parseFloat(commands[i++]);
                        const y = parseFloat(commands[i++]);
                        const pos = new Vector2(x, y);
                        currentPathNodes.push(new PathNode(pos, pos, pos, NodeType.CORNER));
                        currentPos = pos;
                        break;
                    }
                    case 'C': {
                        const cp1x = parseFloat(commands[i++]);
                        const cp1y = parseFloat(commands[i++]);
                        const cp2x = parseFloat(commands[i++]);
                        const cp2y = parseFloat(commands[i++]);
                        const x = parseFloat(commands[i++]);
                        const y = parseFloat(commands[i++]);

                        // Previous node needs outgoing handle (cp1)
                        if (currentPathNodes.length > 0) {
                            const prev = currentPathNodes[currentPathNodes.length - 1];
                            const newPrev = prev.update({
                                handleOut: new Vector2(cp1x, cp1y)
                            });
                            currentPathNodes[currentPathNodes.length - 1] = newPrev;
                        }

                        const pos = new Vector2(x, y);
                        // New node needs incoming handle (cp2)
                        currentPathNodes.push(new PathNode(
                            pos,
                            new Vector2(cp2x, cp2y),
                            pos, // handleOut defaults to pos until next C overrides it? 
                            // Actually for C, the next segment defines next handles. 
                            // This node is the END of this cubic segment.
                            NodeType.CORNER // Default
                        ));
                        currentPos = pos;
                        break;
                    }
                    case 'Z':
                    case 'z': {
                        currentPathClosed = true;
                        // 'Z' often implies a line back to start if not already there.
                        // Our Path automatically closes visually.
                        // But if there's a specific curve back to start?
                        // Usually Z is just straight line.
                        flushPath();
                        break;
                    }
                    default:
                        console.warn(`SVGParser: Unsupported command '${cmd}'`);
                        // Skip args? A simple parser like this might fail hard if we don't know arg count.
                        // Real SVG parser is complex state machine.
                        break;
                }
            } else {
                // Number encountered where command expected?
                // Implicit repetition of previous command.
                // TODO: Implement implicit command repetition if needed.
                // For now, assume explicit commands or M L L L structure.
                // Actually M x y x y is treated as M x y L x y.
                // We'll skip complex cases for MVP.
            }
        }

        flushPath(); // Flush any remaining
        return paths;
    }
}
