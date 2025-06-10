<script lang="ts">
import { page } from '$app/state';
import Header from '$lib/components/Header.svelte';

const { children, data } = $props();
type Link = {
  name: string;
  href: string;
  compare: (path: string) => boolean;
};

type Links = Link[];

const session = $derived(data.session);
const user = $derived(session?.user ?? null);

const links = $derived.by(() => {
  const links: Links = [
    {
      name: 'Home',
      href: '/',
      compare: (path: string) => path === '' || path === '/',
    },
  ];

  if (!!user) {
    links.push({
      name: 'Dashboard',
      href: '/admin/',
      compare: (path: string) => path.includes('/admin'),
    });
  }

  return links;
});
</script>
<Header session={data.session}>
  {#snippet navLinks(closeMenu)}
    {#each links as link}
      <a href={link.href} class:active={link.compare(page.url.pathname)}
         onclick={closeMenu}
         class="rounded-md px-3 py-2 text-sm font-medium block sm:inline hover:bg-spark-primary-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">{link.name}</a>
    {/each}
  {/snippet}
</Header>
{@render children()}