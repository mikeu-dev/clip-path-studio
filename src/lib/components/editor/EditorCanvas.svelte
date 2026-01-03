<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { Renderer } from '$lib/engine/render/Renderer';
	import { InteractionManager } from '$lib/engine/interaction/InteractionManager';
	import { EditorStore, EDITOR_KEY } from '$lib/stores/editor.svelte';
	import { Path } from '$lib/engine/core/Path';
	import { PathNode, NodeType } from '$lib/engine/core/PathNode';
	import { Vector2 } from '$lib/engine/math/Vector2';

	// Get Store from Context (provided by +page.svelte)
	const store = getContext<EditorStore>(EDITOR_KEY);

	// Dummy Initial Data (Only if empty, for testing)
	if (store && store.paths.length === 0) {
		const INITIAL_PATHS = [
			new Path(
				[
					new PathNode(
						new Vector2(100, 100),
						new Vector2(100, 100),
						new Vector2(150, 100),
						NodeType.SMOOTH
					),
					new PathNode(
						new Vector2(300, 100),
						new Vector2(250, 100),
						new Vector2(300, 150),
						NodeType.SMOOTH
					),
					new PathNode(
						new Vector2(300, 300),
						new Vector2(300, 250),
						new Vector2(250, 300),
						NodeType.SMOOTH
					),
					new PathNode(
						new Vector2(100, 300),
						new Vector2(150, 300),
						new Vector2(100, 250),
						NodeType.SMOOTH
					)
				],
				true
			)
		];
		store.setPaths(INITIAL_PATHS);
	}

	let canvasEl: HTMLCanvasElement;
	let renderer: Renderer;
	let interaction: InteractionManager;

	onMount(() => {
		if (!canvasEl) return;

		// 1. Setup Renderer
		renderer = new Renderer(canvasEl);

		// 2. Setup Interaction
		interaction = new InteractionManager(canvasEl, store);
		interaction.setPaths(store.paths);

		// Connect Two-way binding
		// Store -> Engine
		const unsubscribe = $effect.root(() => {
			$effect(() => {
				renderer.setPaths(store.paths);
				renderer.setViewport(store.pan, store.zoom);
				interaction.setPaths(store.paths);
			});

			$effect(() => {
				// Activate tool from store state
				interaction.activateTool(store.activeTool);
			});
		});

		// Engine -> Store
		// (Handled internally by InteractionManager via store ref, or we can explicit hook here)
		// InteractionManager now has reference to store in Context, so it dispatches logic directly?
		// In InteractionManager refactor we passed 'store' to it.
		// And SelectTool calls 'store.select'.
		// PenTool calls 'setPaths' on context (Local InteractionManager) -> Update paths -> calls onPathsChange?

		// We kept `onPathsChange` in InteractionManager.
		interaction.onPathsChange = (newPaths) => {
			store.setPaths(newPaths);
		};

		// SelectTool calls store.select directly via Context.
		// So onSelectionChange hook might be redundant if Tool does it directly,
		// but good to keep for decoupling if InteractionManager was standalone.
		// In our refactor, activeTool calls store.select.

		return () => {
			renderer.destroy();
			interaction.destroy();
			unsubscribe();
		};
	});
</script>

<div class="editor-container relative h-full w-full overflow-hidden">
	<canvas bind:this={canvasEl} class="block h-full w-full touch-none outline-none"></canvas>

	<div
		class="pointer-events-none absolute top-4 left-4 rounded bg-black/60 p-2 text-xs text-white backdrop-blur select-none"
	>
		Paths: {store.paths.length} <br />
		Selection: {store.selection
			? `${store.selection.type} (${store.selection.distance.toFixed(1)}px)`
			: 'None'} <br />
		Tool: {store.activeTool}
	</div>
</div>
