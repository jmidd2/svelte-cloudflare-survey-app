<script lang="ts">
import { formElementTags, formElements } from '$lib';
import FormElement from '$lib/components/FormElement.svelte';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '$lib/components/ui/accordion/index.js';
import type { HtmlFormElements } from '$lib/types';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import {
  Calendar,
  Check,
  ChevronsLeftRightEllipsis,
  Hash,
  type Icon as IconType,
  List,
  ListTodo,
  Mail,
  Phone,
  Text,
  TextCursorInput,
} from '@lucide/svelte';
import ToolboxFormEleList from './ToolboxFormEleList.svelte';

// Get editor from context
const editor = getSurveyEditor();

// Reactive references
const fields = $derived(editor.fields);
const selectedIndex = $derived(editor.selectedIndex);
const selectedField = $derived(editor.selectedField);

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
    <Accordion type="multiple" value={['toolbox']}>
        <AccordionItem value="toolbox">
            <AccordionTrigger class="px-4 py-2 hover:cursor-pointer">
                Toolbox
            </AccordionTrigger>
            <AccordionContent class="px-4 pb-4 pt-1">
                <ul class="space-y-2">
                    {#each draggableFormElements as [element, {icon, label}]}
                        <FormElement {element} {label} {icon} />
                    {/each}
                </ul>
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="form-elements">
            <AccordionTrigger class="px-4 py-2 hover:cursor-pointer">
                Form Elements
            </AccordionTrigger>
            <AccordionContent class="px-4 pb-4 pt-1">
                <ToolboxFormEleList />
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</div>