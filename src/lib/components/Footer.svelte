<script lang="ts">
const { children } = $props();
</script>

<footer class="bg-spark-secondary-600 p-8 pb-20">
    <div class="w-250 mx-auto px-4">{@render children()}</div>
</footer>