<script lang="ts">
import type { SelectFormField } from '$lib/server/db/schema';

type Props = {
  field: SelectFormField;
};
let { field }: Props = $props();
</script>

<div class="border-solid rounded p-2 bg-white text-black">{field.label}</div>
