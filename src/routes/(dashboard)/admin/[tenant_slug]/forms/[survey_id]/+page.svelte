<script lang="ts">
import SurveyFormField from '$lib/components/SurveyFormField.svelte';

const { data } = $props();

let formFields = $state(data.fields);
const survey = $derived(data.survey);
let isActive = $derived(survey.active);
let acceptDrop = $state<'none' | 'top' | 'bottom'>('none');
const sorted = $derived(
  formFields.toSorted((a, b) => {
    if (a.orderIndex - b.orderIndex > 0) {
      return 1;
    }

    if (a.orderIndex - b.orderIndex < 0) {
      return -1;
    }
    return 0;
  })
);

const isAdmin = $derived(
  data.session?.user ? data.session.user.roles.includes('admin') : false
);
$effect(() => {
  console.log('drawing page');
});

function saveSorted() {
  const sortedData = sorted.map((val, index) => {
    return {
      orderIndex: index + 1,
      id: val.id,
    };
  });

  fetch('/api/survey/order', {
    method: 'POST',
    body: JSON.stringify(sortedData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

$inspect(formFields);

function moveItem(newOrderIndex, sortedIndex, id) {
  console.log('moving');
  const index = formFields.findIndex(val => val.id === id);
  console.log('old', formFields[index].orderIndex);
  if (index > -1) {
    formFields[index].orderIndex = newOrderIndex;
    console.log('new', formFields[index].orderIndex);
    saveSorted();
  }
}
</script>

<h1>{survey.title}<span>Survey #{data.id}</span></h1>
<p>{survey.description}</p>
<div class="border-b">
    <h2>Settings</h2>
    <div><input type="checkbox" bind:checked={isActive} disabled={!isAdmin}/></div>
    <div>{JSON.stringify(survey.settings)}</div>
</div>
<ul>
    {#each sorted as item, index (item.id)}
        <SurveyFormField {moveItem} nextOrder={sorted[index + 1] ? sorted[index + 1].orderIndex : item.orderIndex + 1}
                         previousOrder={sorted[index - 1] ? sorted[index - 1].orderIndex : 0} {item} {index}/>
    {/each}
</ul>