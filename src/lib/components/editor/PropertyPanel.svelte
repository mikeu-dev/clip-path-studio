<script lang="ts">
	import { getContext } from 'svelte';
	import { EditorStore, EDITOR_KEY } from '$lib/stores/editor.svelte';
	import { NodeType } from '$lib/engine/core/PathNode';
	import { Vector2 } from '$lib/engine/math/Vector2';

	import { UpdatePathCommand } from '$lib/engine/commands/UpdatePathCommand';

	const store = getContext<EditorStore>(EDITOR_KEY);

	// Derived state for selection
	// Svelte 5 runes: we can just use derived logic inside effect or computed

	let selectedNode = $state<{ x: number; y: number } | null>(null);
	let selectedPathId = $state<string | null>(null);
	let selectedNodeIndex = $state<number | null>(null);

	$effect(() => {
		const sel = store.selection;
		if (sel && sel.type === 'node' && sel.nodeIndex !== undefined) {
			const path = store.paths.find((p) => p.id === sel.pathId);
			if (path) {
				const node = path.nodes[sel.nodeIndex];
				selectedNode = { x: node.position.x, y: node.position.y };
				selectedPathId = sel.pathId;
				selectedNodeIndex = sel.nodeIndex;
				return;
			}
		}
		selectedNode = null;
		selectedPathId = null;
		selectedNodeIndex = null;
	});

	function updateNode(axis: 'x' | 'y', value: number) {
		if (!selectedPathId || selectedNodeIndex === null) return;

		const pathIdx = store.paths.findIndex((p) => p.id === selectedPathId);
		if (pathIdx === -1) return;

		const path = store.paths[pathIdx];
		const node = path.nodes[selectedNodeIndex];

		const delta = value - node.position[axis];
		if (Math.abs(delta) < 0.001) return; // No change

		// Create new Vector2 since it is immutable
		const pos =
			axis === 'x' ? new Vector2(value, node.position.y) : new Vector2(node.position.x, value);

		// Also shift handles by delta to maintain shape
		const deltaVec = axis === 'x' ? new Vector2(delta, 0) : new Vector2(0, delta);

		const newNode = node.update({
			position: pos,
			handleIn: node.handleIn.add(deltaVec),
			handleOut: node.handleOut.add(deltaVec)
		});

		const newPath = path.updateNode(selectedNodeIndex, newNode);

		// Execute Command
		store.execute(new UpdatePathCommand(store, path, newPath));
	}

	function updatePathClosed(path: import('$lib/engine/core/Path').Path, closed: boolean) {
		const newPath = path.setClosed(closed);
		// Execute Command
		store.execute(new UpdatePathCommand(store, path, newPath));
	}
</script>

<div class="p-4 text-xs">
	<h3 class="mb-4 font-bold tracking-wider text-neutral-500 uppercase">Properties</h3>

	{#if selectedNode}
		<div class="space-y-2 rounded bg-neutral-800/50 p-2">
			<div class="mb-2 border-b border-neutral-700 pb-1 font-semibold text-neutral-400">
				Selected Node
			</div>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<label for="node-x" class="mb-1 block text-neutral-500">X</label>
					<input
						id="node-x"
						type="number"
						value={Math.round(selectedNode.x * 10) / 10}
						oninput={(e) => updateNode('x', parseFloat(e.currentTarget.value))}
						class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-white transition-colors outline-none focus:border-blue-500"
					/>
				</div>
				<div>
					<label for="node-y" class="mb-1 block text-neutral-500">Y</label>
					<input
						id="node-y"
						type="number"
						value={Math.round(selectedNode.y * 10) / 10}
						oninput={(e) => updateNode('y', parseFloat(e.currentTarget.value))}
						class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-white transition-colors outline-none focus:border-blue-500"
					/>
				</div>
			</div>
		</div>
	{:else if store.selection && store.selection.type === 'path'}
		<div class="rounded bg-neutral-800/50 p-2">
			<div class="mb-2 font-semibold text-neutral-400">Path Properties</div>
			<div class="mb-2 text-xs text-neutral-500">ID: {store.selection.pathId.slice(0, 8)}...</div>

			{#if store.paths.find((p) => p.id === store.selection!.pathId)}
				{@const path = store.paths.find((p) => p.id === store.selection!.pathId)}
				{#if path}
					<label class="flex items-center gap-2 text-sm text-neutral-300">
						<input
							type="checkbox"
							checked={path.closed}
							onchange={(e) => {
								updatePathClosed(path, e.currentTarget.checked);
							}}
							class="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500/50"
						/>
						Closed Path
					</label>
				{/if}
			{/if}
		</div>
	{:else if store.selectedPathIds.size !== 2}
		<div class="mt-8 text-center text-neutral-600 italic">No selection</div>
	{/if}

	<!-- Boolean Ops (Only when exactly 2 paths selected) -->
	{#if store.selectedPathIds.size === 2}
		<div class="mt-4 border-t border-neutral-700 pt-4">
			<h3 class="mb-2 font-bold tracking-wider text-neutral-500 uppercase">Boolean Ops</h3>
			<div class="flex gap-2">
				<button
					class="rounded bg-neutral-700 px-3 py-1 hover:bg-neutral-600"
					onclick={() => store.performBooleanOp('union')}
					title="Union"
				>
					Union
				</button>
				<button
					class="rounded bg-neutral-700 px-3 py-1 hover:bg-neutral-600"
					onclick={() => store.performBooleanOp('subtract')}
					title="Subtract"
				>
					Subtract
				</button>
			</div>
		</div>
	{/if}

	<!-- Layers List -->
	<div class="mt-8 border-t border-neutral-700 pt-4">
		<h3 class="mb-2 font-bold tracking-wider text-neutral-500 uppercase">Layers</h3>
		<div class="space-y-1">
			{#each store.paths as path}
				<div
					class="flex cursor-pointer items-center rounded p-1 {store.selectedPathIds.has(path.id)
						? 'bg-blue-900/30 text-blue-400'
						: 'text-neutral-400 hover:bg-neutral-800'}"
					onclick={() => store.selectPaths([path.id])}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && store.selectPaths([path.id])}
				>
					<div class="mr-2 h-3 w-3 rounded-sm border border-current"></div>
					<span>{path.id.slice(0, 8)}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
```
