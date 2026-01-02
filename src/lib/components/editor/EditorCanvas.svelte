<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer } from '$lib/engine/render/Renderer';
  import { InteractionManager } from '$lib/engine/interaction/InteractionManager';
  import { EditorStore, EDITOR_KEY } from '$lib/stores/editor.svelte';
  import { setContext } from 'svelte';
  import { Path } from '$lib/engine/core/Path';
  import { PathNode, NodeType } from '$lib/engine/core/PathNode';
  import { Vector2 } from '$lib/engine/math/Vector2';

  // Initialize Store
  const store = new EditorStore();
  setContext(EDITOR_KEY, store);
  
  // Dummy Initial Data
  const INITIAL_PATHS = [
      new Path([
          new PathNode(new Vector2(100, 100), new Vector2(100, 100), new Vector2(150, 100), NodeType.SMOOTH),
          new PathNode(new Vector2(300, 100), new Vector2(250, 100), new Vector2(300, 150), NodeType.SMOOTH),
          new PathNode(new Vector2(300, 300), new Vector2(300, 250), new Vector2(250, 300), NodeType.SMOOTH),
          new PathNode(new Vector2(100, 300), new Vector2(150, 300), new Vector2(100, 250), NodeType.SMOOTH)
      ], true)
  ];
  store.setPaths(INITIAL_PATHS);

  let canvasEl: HTMLCanvasElement;
  let renderer: Renderer;
  let interaction: InteractionManager;

  onMount(() => {
    if (!canvasEl) return;

    // 1. Setup Renderer
    renderer = new Renderer(canvasEl);
    
    // 2. Setup Interaction
    interaction = new InteractionManager(canvasEl);
    interaction.setPaths(store.paths);
    
    // Connect Two-way binding
    // Store -> Engine
    const unsubscribe = $effect.root(() => {
        $effect(() => {
            // When store paths change, update engine
            // Optimized: In a real app we diff changes. 
            // Here we just full replace which is fine for < 1000 nodes.
            renderer.setPaths(store.paths);
            interaction.setPaths(store.paths);
        });
    });

    // Engine -> Store
    interaction.onPathsChange = (newPaths) => {
        // This comes from drag operations. 
        // We update store without triggering re-render loop if possible? 
        // Or just standard update.
        store.setPaths(newPaths);
    };
    
    interaction.onSelectionChange = (hit) => {
        store.select(hit);
    };

    return () => {
       renderer.destroy();
       interaction.destroy();
       unsubscribe();
    };
  });
</script>

<div class="editor-container w-full h-full relative bg-neutral-900 overflow-hidden">
  <canvas 
    bind:this={canvasEl} 
    class="block w-full h-full outline-none touch-none"
  ></canvas>
  
  <!-- Overlay Controls (e.g. selection box) could go here -->
  <div class="absolute top-4 left-4 bg-black/60 text-white p-2 rounded text-xs backdrop-blur pointer-events-none">
     Paths: {store.paths.length} <br>
     Selection: {store.selection ? `${store.selection.type} (${store.selection.distance.toFixed(1)}px)` : 'None'}
  </div>
</div>
