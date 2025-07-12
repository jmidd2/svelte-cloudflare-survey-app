<script lang="ts">
const { data } = $props();
$inspect(data);
</script>
<div class="px-4 py-3">
<h1>The results for survey: {data.survey.title}</h1>
</div>