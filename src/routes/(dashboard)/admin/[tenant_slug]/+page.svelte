<script lang="ts">
const { data } = $props();

const tenantSlug = $derived(data.tenant.slug);
const tenantName = $derived(data.tenant.name);
const forms = $derived(data.forms);
$inspect(data);
</script>
<h1>{tenantName}</h1>
<div>Admin Page</div>
<div>
    {#each forms as survey}
        <div class="border-b my-2 py-3">
        <h2>{survey.title}</h2>
        <p>{survey.description}</p>
            <a href={`/survey/${survey.id}`}>Take Survey</a>
            <a href={`${tenantSlug}/forms/${survey.id}`}>Edit</a>
        </div>
    {/each}
</div>