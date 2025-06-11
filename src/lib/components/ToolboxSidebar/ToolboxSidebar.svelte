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

<Accordion type="multiple" value={['toolbox']}>
    <AccordionItem value="toolbox">
        <AccordionTrigger class="px-4 py-3 bg-muted/10 hover:bg-muted/30 border-b-muted border-b hover:cursor-pointer">
            Toolbox
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4 pt-1">
          <ToolboxElementList />
        </AccordionContent>
    </AccordionItem>
    <AccordionItem value="form-elements">
        <AccordionTrigger class="px-4 py-3 bg-muted/10 hover:bg-muted/30 border-b-muted border-b hover:cursor-pointer">
            Form Elements
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4 pt-1 border-b border-b-muted">
            <ToolboxFormFieldList />
        </AccordionContent>
    </AccordionItem>
</Accordion>