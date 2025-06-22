<script lang="ts">
import {
  ToolboxElementList,
  ToolboxFormFieldList,
} from '$lib/components/ToolboxSidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '$lib/components/ui/accordion/index.js';
</script>

<div class="h-full flex flex-col bg-card">
  <Accordion type="multiple" value={['toolbox', 'form-elements']} class="flex-1">
    <AccordionItem value="toolbox" class="border-b">
      <AccordionTrigger class="rounded-none px-4 py-3 hover:bg-muted/50 text-sm font-medium">
        Fields
      </AccordionTrigger>
      <AccordionContent class="px-4 pb-4">
        <ToolboxElementList />
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="form-elements" class="border-b">
      <AccordionTrigger class="rounded-none px-4 py-3 hover:bg-muted/50 text-sm font-medium">
        Form Elements
      </AccordionTrigger>
      <AccordionContent class="px-4 pb-4">
        <ToolboxFormFieldList />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>