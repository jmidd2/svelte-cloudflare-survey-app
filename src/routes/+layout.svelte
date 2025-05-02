<script lang="ts">
import '../app.css';
import { page } from '$app/state';
import Footer from '$lib/components/Footer.svelte';
import Header from '$lib/components/Header.svelte';

type Link = {
  name: string;
  href: string;
  compare: (path: string) => boolean;
};

type Links = Link[];

let { children, data } = $props();

const links: Links = [
  {
    name: 'Home',
    href: '/',
    compare: (path: string) => path === '' || path === '/',
  },
  {
    name: 'Dashboard',
    href: '/admin',
    compare: (path: string) => path.includes('/admin'),
  },
  {
    name: 'Survey',
    href: '/survey/1',
    compare: (path: string) => path.includes('/survey'),
  },
];
</script>

<div class="flex min-h-screen flex-col">
    <Header session={data.session}>
        {#snippet navLinks()}
            {#each links as link}
                <a href={link.href} class:active={link.compare(page.url.pathname)}
                   class="rounded-md px-3 py-2 text-sm font-medium  hover:bg-spark-primary-700 hover:text-white">{link.name}</a>
            {/each}
        {/snippet}
    </Header>
    <main class="bg-spark-secondary-800/40 flex-1 w-full lg:w-250 mx-auto p-4">{@render children()}</main>
    <Footer>This is a footer</Footer>
</div>
