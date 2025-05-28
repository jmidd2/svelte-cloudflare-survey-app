<script lang="ts">
import Footer from '$lib/components/Footer.svelte';

let { children } = $props();
</script>


<main class="bg-spark-secondary-800/40 flex-1 w-full lg:w-250 mx-auto p-4">{@render children()}</main>
<Footer>This is a footer</Footer>
