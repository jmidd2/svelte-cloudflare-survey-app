<script lang="ts">
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';

const bgColor: Record<HtmlFormElements, string> = {
  text: 'bg-violet-200 ',
  select: 'bg-amber-200',
  radio: 'bg-green-200',
  checkbox: 'bg-green-200',
  date: 'bg-green-200',
  tel: 'bg-green-200',
  email: 'bg-green-200',
  number: 'bg-green-200',
  range: 'bg-green-200',
  textarea: 'bg-green-200',
};

const label: Record<HtmlFormElements, string> = {
  text: 'Text Box',
  select: 'Select',
  radio: 'Radio',
  checkbox: 'Checkbox',
  date: 'Date',
  tel: 'Telephone',
  email: 'Email',
  number: 'Number',
  range: 'Range',
  textarea: 'Textarea',
};

let { status }: { status: HtmlFormElements } = $props();
</script>

<div class="flex w-[100px] justify-end">
    <span
            class={`${bgColor[status]} uppercase p-1 rounded font-semibold flex-shrink-0 text-xs text-slate-900 `}
    >
    {label[status]}
    </span>
</div>