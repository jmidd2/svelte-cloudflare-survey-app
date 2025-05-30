<script lang="ts">
import { formElementTags, formElements } from '$lib';
import FormElement from '$lib/components/FormElement.svelte';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '$lib/components/ui/accordion/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';
import {
  Calendar,
  Check,
  ChevronsLeftRightEllipsis,
  GripVertical,
  Hash,
  type Icon as IconType,
  List,
  ListTodo,
  Mail,
  Phone,
  Text,
  TextCursorInput,
} from '@lucide/svelte';

type Props = {
  formFields: SelectFormField[];
  selectedFormField: SelectFormField;
};

let { formFields, selectedFormField = $bindable() }: Props = $props();
const formElementIcons: Record<HtmlFormElements, typeof IconType> = {
  checkbox: ListTodo,
  date: Calendar,
  email: Mail,
  number: Hash,
  radio: List,
  range: ChevronsLeftRightEllipsis,
  tel: Phone,
  text: TextCursorInput,
  textarea: Text,
  select: List,
  'yes-no': Check,
};

const draggableFormElements = new Map<
  HtmlFormElements,
  { label: string; icon: typeof IconType }
>();

for (const element of formElements) {
  draggableFormElements.set(element, {
    label: formElementTags[element],
    icon: formElementIcons[element],
  });
}
</script>

<div class="w-64 border-r border-spark-secondary-600 flex flex-col h-full">
  <Accordion type="multiple" value={['toolbox', 'form-elements']}>
    <AccordionItem value="toolbox">
      <AccordionTrigger class="px-4 py-2 hover:cursor-pointer">Toolbox</AccordionTrigger>
      <AccordionContent class="px-4 pb-4 pt-1">
        <ul class="space-y-2">
          {#each draggableFormElements as [element, {icon, label}]}
            <FormElement {element} {label} {icon}></FormElement>
          {/each}
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="form-elements">
      <AccordionTrigger class="px-4 py-2 hover:cursor-pointer">Form Elements</AccordionTrigger>
      <AccordionContent class="px-4 pb-4 pt-1">
        <ul class="space-y-2">
          {#each formFields as formField}
            <li onclick={() => { selectedFormField = formField }} class={["cursor-grab line-clamp-1 flex border rounded-lg p-1 text-xs items-center", {'border-spark-primary':selectedFormField?.id === formField.id}]}><GripVertical class="size-3"></GripVertical><p class="truncate text-ellipsis flex-1 ml-1 mr-2">{formField.label}</p><Badge class="text-[10px]" variant="secondary">{formElementTags[formField.type]}</Badge></li>
          {/each}
        </ul>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>