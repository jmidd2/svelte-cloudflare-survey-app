<script lang="ts">
import '../app.css';
import Header from '$lib/components/Header.svelte';

let { children, data } = $props();
</script>
<div class="flex min-h-screen flex-col">
    <Header session={data.session} />
    <main class="bg-spark-secondary-800/40 flex-1 min-w-full lg:min-w-250 mx-auto p-4">{@render children()}</main>
    <footer class="bg-spark-secondary-600 p-4">Footer</footer>
</div>
