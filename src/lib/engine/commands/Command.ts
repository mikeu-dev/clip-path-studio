export interface Command {
    execute(): void;
    undo(): void;
    // Optional: merge(other: Command): boolean; // For combining drag events
}

export class CommandHistory {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private maxHistory: number = 50;

    // Callback when state changes
    onChange?: () => void;

    execute(command: Command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo on new action

        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        this.onChange?.();
    }

    undo() {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
            this.onChange?.();
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
            this.onChange?.();
        }
    }

    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.onChange?.();
    }
}
