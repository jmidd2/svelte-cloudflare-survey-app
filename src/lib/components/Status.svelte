<script lang="ts">
import { Badge } from '$lib/components/ui/badge/index.js';
import type { FormFieldType } from '$lib/types';
import { FIELD_LABELS } from '$lib/utils';

let { status }: { status: FormFieldType } = $props();
</script>

<div class="flex w-[100px] justify-end">
    <Badge variant="secondary" class="">
    {FIELD_LABELS[status]}
    </Badge>
</div>