<script>
	import EditorCanvas from '$lib/components/editor/EditorCanvas.svelte';
	import PropertyPanel from '$lib/components/editor/PropertyPanel.svelte';
	import ExportModal from '$lib/components/ui/ExportModal.svelte';
	import { setContext, getContext } from 'svelte';
	import { EDITOR_KEY, EditorStore } from '$lib/stores/editor.svelte';
	import { SVGGenerator } from '$lib/engine/export/SVGGenerator';
	import { CSSGenerator } from '$lib/engine/export/CSSGenerator';

	// We can't access store directly here because it's created inside EditorCanvas?
	// Wait, EditorCanvas creates the store. That's inverted dependency.
	// Better: Page creates store, passes to context, EditorCanvas uses it.

	// Let's refactor: Create store at Page level.
	const store = new EditorStore();
	setContext(EDITOR_KEY, store);

	import { SVGParser } from '$lib/engine/export/SVGParser'; // Add import

	let isExportOpen = false;
	let exportContent = '';
	let exportTitle = 'Export SVG';

	let fileInput: HTMLInputElement; // Bind to input

	function handleExport() {
		// Default to SVG for now
		exportContent = SVGGenerator.toSVGString(store.paths);
		exportTitle = 'Export SVG';
		isExportOpen = true;
	}

	function handleImportClick() {
		if (fileInput) fileInput.click();
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const text = await file.text();
		const importedPaths = SVGParser.parse(text);

		if (importedPaths.length > 0) {
			// Add to store
			// Could use a Command for undo support
			importedPaths.forEach((p) => store.addPath(p));
		}

		// Reset input
		target.value = '';
	}
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 font-sans text-neutral-300"
>
	<!-- Header / Menu Bar -->
	<!-- ... Header content same ... -->
	<header
		class="z-10 flex h-12 items-center border-b border-neutral-800 bg-neutral-900 px-4 select-none"
	>
		<div class="mr-8 font-bold text-neutral-100">Clip Path Studio</div>
		<nav class="flex space-x-4 text-sm">
			<button class="transition-colors hover:text-white">File</button>
			<button class="transition-colors hover:text-white">Edit</button>
			<button class="transition-colors hover:text-white">View</button>
		</nav>
		<div class="flex-1"></div>
		<div class="flex space-x-2">
			<div
				class="mr-4 flex items-center space-x-1 border-r border-neutral-700 pr-4 text-xs text-neutral-500"
			>
				<span class={store.canUndo ? 'cursor-pointer text-white' : 'opacity-30'}>Undo</span>
				<span class={store.canRedo ? 'cursor-pointer text-white' : 'opacity-30'}>Redo</span>
			</div>

			<input
				type="file"
				accept=".svg"
				class="hidden"
				bind:this={fileInput}
				onchange={handleFileSelect}
			/>

			<button
				class="mr-2 rounded bg-neutral-700 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-neutral-600"
				onclick={handleImportClick}>Import SVG</button
			>

			<button
				class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
				onclick={handleExport}>Export SVG</button
			>
		</div>
	</header>

	<div class="relative flex flex-1 overflow-hidden">
		<!-- Toolbar (Left) -->
		<aside
			class="z-10 flex w-12 flex-col items-center space-y-4 border-r border-neutral-800 bg-neutral-900 py-4"
		>
			<!-- Select Tool -->
			<button
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors {store.activeTool ===
				'select'
					? 'bg-blue-600 text-white'
					: 'bg-neutral-800 hover:bg-neutral-700'}"
				title="Select Tool (V)"
				onclick={() => store.setTool('select')}
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current"
					><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6V2z" /></svg
				>
			</button>

			<!-- Pen Tool -->
			<button
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors {store.activeTool ===
				'pen'
					? 'bg-blue-600 text-white'
					: 'bg-neutral-800 hover:bg-neutral-700'}"
				title="Pen Tool (P)"
				onclick={() => store.setTool('pen')}
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current"
					><path
						d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
					/></svg
				>
			</button>
		</aside>

		<!-- Canvas Area (Center) -->
		<main class="relative flex-1 bg-neutral-950">
			<EditorCanvas />
		</main>

		<!-- Property Sidebar (Right) -->
		<aside class="border-box z-10 w-64 border-l border-neutral-800 bg-neutral-900">
			<PropertyPanel />
		</aside>
	</div>

	<ExportModal
		isOpen={isExportOpen}
		title={exportTitle}
		content={exportContent}
		onClose={() => (isExportOpen = false)}
	/>
</div>
