<script lang="ts">
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
import {
  Banknote,
  Check,
  Coffee,
  CreditCard,
  Crown,
  Gift,
  Heart,
  PartyPopper,
  Smile,
  Sparkles,
  Wallet,
  X,
  Zap,
} from '@lucide/svelte';

// Fake "premium" features for humor
const plans = [
  {
    name: 'Free Forever',
    price: '$0',
    period: 'forever and always',
    description: "Everything you need, nothing you don't want to pay for",
    popular: true,
    features: [
      'Unlimited forms (seriously, go wild)',
      'Unlimited responses (we mean it)',
      'Drag & drop form builder',
      'Real-time analytics',
      'Team collaboration',
      'Mobile responsive forms',
      'Secure data storage',
      '24/7 uptime (we try our best)',
      'Email support (when we check our inbox)',
      "No ads (we're not monsters)",
      'No credit card required (obviously)',
      'No hidden fees (there are no fees to hide)',
    ],
    buttonText: "Get Started (It's Free!)",
    buttonVariant: 'default',
  },
  {
    name: 'Premium Deluxe',
    price: '$∞',
    period: 'per month',
    description: 'For people who insist on paying for things',
    popular: false,
    unavailable: true,
    features: [
      'Everything in Free Forever',
      'A sense of superiority',
      'Bragging rights at parties',
      'Our eternal gratitude',
      'A virtual high-five',
      "The ability to say 'I paid for this'",
      'Exclusive access to... nothing extra',
      'Premium support (same as free support)',
      'Golden pixels (invisible to naked eye)',
      'Unicorn-powered servers (not really)',
      'Time travel capabilities (coming never)',
      'Mind reading features (still working on it)',
    ],
    buttonText: 'Not Available',
    buttonVariant: 'outline',
  },
  {
    name: 'Enterprise Ultra',
    price: 'Your Soul',
    period: 'for eternity',
    description: 'Because some things are more valuable than money',
    popular: false,
    unavailable: true,
    features: [
      'Everything in Premium Deluxe',
      "Direct line to the CEO (it's just me)",
      'Custom domain (you can ask nicely)',
      "White-label solution (with a 'please don't' note)",
      'Dedicated server (in my basement)',
      '24/7 phone support (my personal number)',
      "On-site installation (I'll come over)",
      'Lifetime warranty (as long as I live)',
      'Your name in the credits',
      'A handwritten thank you note',
      'Naming rights to a feature',
      'My undying friendship',
    ],
    buttonText: 'Soul Not Accepted',
    buttonVariant: 'outline',
  },
];

const faqs = [
  {
    question: 'Is this really free?',
    answer:
      "Yes! Completely, totally, absolutely free. No tricks, no trials, no 'gotchas'. I built this because I wanted to, not because I wanted your money.",
  },
  {
    question: "What's the catch?",
    answer:
      "There isn't one. I know it's suspicious in 2025, but some things can still be free. Like air, sunsets, and apparently form builders.",
  },
  {
    question: 'How do you make money?',
    answer:
      "I don't! This is a passion project. I have a day job that pays the bills. This just makes me happy.",
  },
  {
    question: 'Will you ever charge for this?',
    answer:
      "Nope. Never. Not happening. I'd rather eat my keyboard than charge for basic form building. And I really like my keyboard.",
  },
  {
    question: 'Can I donate or pay you anyway?',
    answer:
      "That's very kind, but no thank you! Just use the service and tell your friends if you like it. That's payment enough.",
  },
  {
    question: 'What if I really, really want to pay?',
    answer:
      'Then donate to a charity instead! Make the world a better place rather than making my bank account bigger.',
  },
];

function handleGetStarted() {
  window.location.href = '/register';
}
</script>

<svelte:head>
  <title>Pricing - FormBuilder (Spoiler: It's Free!)</title>
  <meta name="description" content="Our pricing is simple: $0. Forever. No really, we mean it." />
</svelte:head>

<div class="bg-background">
  <!-- Hero Section -->
  <section class="py-20 lg:py-32">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto text-center">
        <Badge variant="secondary" class="mb-6">
          <PartyPopper class="h-3 w-3 mr-1" />
          100% Free, 0% Nonsense
        </Badge>

        <h1 class="text-4xl lg:text-6xl font-bold text-foreground mb-6">
          Our Pricing is
          <span class="text-primary">Ridiculously Simple</span>
        </h1>

        <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          We believe form building should be free. Not "free trial" free, not "freemium" free,
          but actually, genuinely, no-strings-attached free.
        </p>

        <div class="flex items-center justify-center gap-4 mb-8">
          <div class="flex items-center gap-2 text-muted-foreground">
            <X class="h-4 w-4 text-red-500" />
            <span class="line-through">Credit cards</span>
          </div>
          <div class="flex items-center gap-2 text-muted-foreground">
            <X class="h-4 w-4 text-red-500" />
            <span class="line-through">Hidden fees</span>
          </div>
          <div class="flex items-center gap-2 text-muted-foreground">
            <X class="h-4 w-4 text-red-500" />
            <span class="line-through">Upgrade nagging</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Cards -->
  <section class="py-20 bg-muted/30">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {#each plans as plan}
          <Card class={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''} ${plan.unavailable ? 'opacity-60' : ''}`}>
            {#if plan.popular}
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge class="bg-primary text-primary-foreground px-4 py-1">
                  <Heart class="h-3 w-3 mr-1" />
                  Most Popular (Only Option)
                </Badge>
              </div>
            {/if}

            <CardHeader class="text-center pb-8">
              <CardTitle class="text-2xl font-bold">{plan.name}</CardTitle>
              <div class="mt-4">
                <span class="text-4xl font-bold text-primary">{plan.price}</span>
                <span class="text-muted-foreground">/{plan.period}</span>
              </div>
              <CardDescription class="mt-2">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent class="space-y-6">
              <ul class="space-y-3">
                {#each plan.features as feature}
                  <li class="flex items-start gap-2">
                    <Check class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span class="text-sm">{feature}</span>
                  </li>
                {/each}
              </ul>

              <Button
                  class="w-full"
                  variant={plan.buttonVariant}
                  disabled={plan.unavailable}
                  onclick={plan.unavailable ? undefined : handleGetStarted}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        {/each}
      </div>
    </div>
  </section>

  <!-- Why Free Section -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-8">
          But Why Is It Free?
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card class="border-0 shadow-sm">
            <CardContent class="p-6 text-center">
              <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Coffee class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 class="font-semibold mb-2">Passion Project</h3>
              <p class="text-sm text-muted-foreground">
                I built this because I love building things, not because I need another revenue stream.
              </p>
            </CardContent>
          </Card>

          <Card class="border-0 shadow-sm">
            <CardContent class="p-6 text-center">
              <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Gift class="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 class="font-semibold mb-2">Giving Back</h3>
              <p class="text-sm text-muted-foreground">
                The internet gave me so much for free. Time to return the favor.
              </p>
            </CardContent>
          </Card>

          <Card class="border-0 shadow-sm">
            <CardContent class="p-6 text-center">
              <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smile class="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 class="font-semibold mb-2">It Makes Me Happy</h3>
              <p class="text-sm text-muted-foreground">
                Seeing people use something I built brings me more joy than money ever could.
              </p>
            </CardContent>
          </Card>
        </div>

        <div class="bg-primary/5 rounded-lg p-8">
          <h3 class="text-xl font-semibold mb-4">The Promise</h3>
          <p class="text-muted-foreground">
            This service will remain free forever. No VC funding to pay back, no shareholders to please,
            no exit strategy to execute. Just a simple form builder that does what it says on the tin,
            without asking for your credit card.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-20 bg-muted/30">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div class="space-y-6">
          {#each faqs as faq}
            <Card>
              <CardContent class="p-6">
                <h3 class="font-semibold text-lg mb-2">{faq.question}</h3>
                <p class="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Ready to Not Pay Anything?
        </h2>
        <p class="text-lg text-muted-foreground mb-8">
          Join the revolution of actually free software. Your wallet will thank you.
        </p>

        <Button size="lg" onclick={handleGetStarted} class="text-lg px-8 py-3">
          <Sparkles class="mr-2 h-5 w-5" />
          Start Building (For Free!)
        </Button>

        <p class="text-sm text-muted-foreground mt-4">
          Seriously, no credit card required. We don't even have a payment processor set up.
        </p>
      </div>
    </div>
  </section>
</div>
