<script lang="ts">
const { data } = $props();

const tenantSlug = $derived(data.tenant.slug);
const tenantName = $derived(data.tenant.name);
const forms = $derived(data.forms);
</script>
<div class="px-4 py-3">
  <h1 class="text-xl">{tenantName} Dashboard</h1>
  <!--<div>Admin Page</div>-->
  <div>
    {#each forms as survey}
      <div class="border-b my-2 py-3">
        <h2 class="text-lg">{survey.title}</h2>
        <p class="text-muted-foreground">{survey.description}</p>
        <p><a class="text-sm hover:underline" href={`/survey/${survey.slug}`}>Take Survey</a></p>
        <p><a class="text-sm hover:underline" href={`${tenantSlug}/forms/${survey.slug}/results`}>View Results</a></p>
        <p><a class="text-sm hover:underline" href={`${tenantSlug}/forms/${survey.slug}`}>Edit</a></p>
      </div>
    {/each}
  </div>
</div>