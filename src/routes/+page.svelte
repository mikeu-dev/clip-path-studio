<script>
	import EditorCanvas from '$lib/components/editor/EditorCanvas.svelte';
	import '../../app.css';
</script>

<div
	class="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 font-sans text-neutral-300"
>
	<!-- Header / Menu Bar -->
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
			<button
				class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
				>Export SVG</button
			>
		</div>
	</header>

	<div class="relative flex flex-1 overflow-hidden">
		<!-- Toolbar (Left) -->
		<aside
			class="z-10 flex w-12 flex-col items-center space-y-4 border-r border-neutral-800 bg-neutral-900 py-4"
		>
			<!-- Tool Icons placeholder -->
			<div
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-neutral-700 transition-colors hover:bg-blue-600"
				title="Select Tool (V)"
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current"
					><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6V2z" /></svg
				>
			</div>
			<div
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-neutral-800 transition-colors hover:bg-neutral-700"
				title="Pen Tool (P)"
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current"
					><path
						d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
					/></svg
				>
			</div>
		</aside>

		<!-- Canvas Area (Center) -->
		<main class="relative flex-1 bg-neutral-950">
			<EditorCanvas />
		</main>

		<!-- Property Sidebar (Right) -->
		<aside class="z-10 w-64 border-l border-neutral-800 bg-neutral-900 p-4">
			<h3 class="mb-4 text-xs font-bold tracking-wider text-neutral-500 uppercase">Properties</h3>
			<div class="space-y-4">
				<div class="rounded bg-neutral-800/50 p-2">
					<div class="mb-1 text-xs text-neutral-400">Position</div>
					<div class="grid grid-cols-2 gap-2">
						<input
							type="number"
							class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white"
							placeholder="X"
						/>
						<input
							type="number"
							class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white"
							placeholder="Y"
						/>
					</div>
				</div>
			</div>
		</aside>
	</div>
</div>
