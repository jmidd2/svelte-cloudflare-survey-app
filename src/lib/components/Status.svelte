<script lang="ts">
import { formElementTags } from '$lib';
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

let { status }: { status: HtmlFormElements } = $props();
</script>

<div class="flex w-[100px] justify-end">
    <span
            class={`${bgColor[status]} uppercase p-1 rounded font-semibold flex-shrink-0 text-sm text-slate-900 `}
    >
    {formElementTags[status]}
    </span>
</div>