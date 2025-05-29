<script lang="ts">
import { formElementTags } from '$lib';
import { Badge } from '$lib/components/ui/badge/index.js';
import type { HtmlFormElements } from '$lib/types';

const bgColor: Record<
  HtmlFormElements,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  text: 'outline',
  select: 'secondary',
  radio: 'secondary',
  checkbox: 'secondary',
  date: 'outline',
  tel: 'outline',
  email: 'outline',
  number: 'outline',
  range: 'destructive',
  textarea: 'outline',
};

let { status }: { status: HtmlFormElements } = $props();
</script>

<div class="flex w-[100px] justify-end">
    <Badge variant={bgColor[status]} class="">
<!--    <span-->
<!--            class={`${bgColor[status]} uppercase p-1 rounded font-semibold flex-shrink-0 text-sm text-slate-900 `}-->
<!--    >-->
    {formElementTags[status]}
<!--    </span>-->
    </Badge>
</div>