<script lang="ts">
import type { SelectFormField } from '$lib/server/db/schema';

const bgColor: Record<SelectFormField['type'], string> = {
  text: 'bg-violet-200 ',
  select: 'bg-amber-200',
  radio: 'bg-green-200',
  checkbox: 'bg-green-200',
};

const label: Record<SelectFormField['type'], string> = {
  text: 'Text Box',
  select: 'Select',
  radio: 'Radio',
  checkbox: 'Checkbox',
};

let { status }: { status: SelectFormField['type'] } = $props();
</script>

<div class="flex w-[100px] justify-end">
    <span
            class={`${bgColor[status]} uppercase p-1 rounded font-semibold flex-shrink-0 text-xs text-slate-900 `}
    >
    {label[status]}
    </span>
</div>