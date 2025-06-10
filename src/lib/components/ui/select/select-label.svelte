<script lang="ts">
import { type WithElementRef, cn } from '$lib/utils';
import type { HTMLAttributes } from 'svelte/elements';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {} = $props();
</script>

<div
	bind:this={ref}
	data-slot="select-label"
	class={cn("flex select-none items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50", className)}
	{...restProps}
>
	{@render children?.()}
</div>
