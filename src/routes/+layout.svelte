<script lang="ts">
import '../app.css';
import { page } from '$app/state';
import Header from '$lib/components/Header.svelte';
let { children, data } = $props();
</script>
<div class="flex h-screen overflow-x-hidden overflow-y-scroll flex-col">

  {@render children()}
</div>