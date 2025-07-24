<script lang="ts">
import { FileText } from '@lucide/svelte';
import clsx from 'clsx';

interface FooterProps {
  class?: string;
}

const { class: className }: FooterProps = $props();
</script>

<footer class={clsx("border-t border-border py-12 mt-5 lg:mt-0 bg-muted/20", className)}>
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center gap-2 font-bold text-xl text-foreground mb-4">
          <div class="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText class="h-5 w-5 text-primary-foreground" />
          </div>
          FormBuilder
        </div>
        <p class="text-muted-foreground text-sm">
          The easiest way to create professional forms and collect responses.
        </p>
      </div>

      <div>
        <h3 class="font-semibold text-foreground mb-4">Product</h3>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li><a href="#features" class="hover:text-foreground">Features</a></li>
          <li><a href="/pricing" class="hover:text-foreground">Pricing</a></li>
          <!--            <li><a href="/templates" class="hover:text-foreground">Templates</a></li>-->
          <!--            <li><a href="/integrations" class="hover:text-foreground">Integrations</a></li>-->
        </ul>
      </div>

      <div>
        <h3 class="font-semibold text-foreground mb-4">Company</h3>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li><a href="https://travisspark.com" rel="noreferrer" class="hover:text-foreground">About</a></li>
          <!--            <li><a href="/blog" class="hover:text-foreground">Blog</a></li>-->
          <!--            <li><a href="/careers" class="hover:text-foreground">Careers</a></li>-->
          <li><a href="/contact" class="hover:text-foreground">Contact</a></li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold text-foreground mb-4">Support</h3>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li><a href="/help" class="hover:text-foreground">Help Center</a></li>
          <li><a href="/docs" class="hover:text-foreground">Documentation</a></li>
          <li><a href="/privacy" class="hover:text-foreground">Privacy Policy</a></li>
          <li><a href="/terms" class="hover:text-foreground">Terms of Service</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
      <p>&copy; 2024 Phoenix Spark. All rights reserved.</p>
    </div>
  </div>
</footer>