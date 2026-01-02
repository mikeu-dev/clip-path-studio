<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	export let title: string = 'Export';
	export let content: string = '';
	export let isOpen: boolean = false;
	export let onClose: () => void;

	let copied = false;

	function copyToClipboard() {
		navigator.clipboard.writeText(content).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop click to close -->
		<button
			class="absolute inset-0 h-full w-full cursor-default focus:outline-none"
			on:click={onClose}
			aria-label="Close modal"
		></button>

		<div
			class="pointer-events-auto relative mx-4 w-full max-w-lg overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
			transition:scale={{ start: 0.95, duration: 150 }}
		>
			<div
				class="flex items-center justify-between border-b border-neutral-800 bg-neutral-800/50 px-4 py-3"
			>
				<h3 class="text-sm font-bold tracking-wide text-white uppercase">{title}</h3>
				<button
					on:click={onClose}
					class="text-neutral-400 transition-colors hover:text-white"
					aria-label="Close"
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5 fill-current"
						><path
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
						/></svg
					>
				</button>
			</div>

			<div class="p-4">
				<textarea
					readonly
					class="h-48 w-full resize-none rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-300 selection:bg-blue-900 selection:text-white focus:border-blue-600 focus:outline-none"
					value={content}
				></textarea>
			</div>

			<div class="flex justify-end space-x-2 bg-neutral-800/30 px-4 py-3">
				<button
					on:click={onClose}
					class="rounded px-4 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
					>Close</button
				>
				<button
					on:click={copyToClipboard}
					class="flex items-center rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
				>
					{#if copied}
						<svg viewBox="0 0 24 24" class="mr-1 h-4 w-4 fill-current"
							><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg
						>
						Copied!
					{:else}
						<svg viewBox="0 0 24 24" class="mr-1 h-4 w-4 fill-current"
							><path
								d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
							/></svg
						>
						Copy Code
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
