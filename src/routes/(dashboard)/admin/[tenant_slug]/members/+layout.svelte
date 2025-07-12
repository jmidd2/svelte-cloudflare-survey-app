<script lang="ts">
import {
  CheckCircleIcon,
  Crown,
  Mail,
  User,
  UserPlus,
  Users,
  XCircle,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { Alert, AlertDescription } from '$lib/components/ui/alert';
import { Button } from '$lib/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$lib/components/ui/dialog';
import {
  FieldErrors,
  FormControl,
  FormField,
  FormLabel,
} from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';
import { sendInviteSchema } from '$lib/validation-schema';

const { children, data } = $props();

const isSiteAdmin = $derived(data.isSiteAdmin);
const canManageMembers = $derived(isSiteAdmin ? true : data.canManageMembers);
const canManageInvites = $derived(isSiteAdmin ? true : data.canManageInvites);

const members = $derived(data.members);
const invites = $derived(data.invitations);
const requests = $derived(data.requests);

// Form handling
const sendInviteForm = superForm(data.sendInviteForm, {
  validators: zod4Client(sendInviteSchema),
  validationMethod: 'oninput',
  onError: ({ result }) => {
    console.error('The form had an error', result);
    toast.error('There was an error sending the invite.', { icon: XCircle });
  },
  onUpdated: ({ form }) => {
    if (form.message) {
      if (form.message.status === 'success') {
        toast.success(form.message.text, { icon: CheckCircleIcon });
      } else if (form.message.status === 'error') {
        toast.error(form.message.text, { icon: XCircle });
      }
    }
  },
});

const { form: sendInviteData, enhance } = sendInviteForm;

// UI State
let sendDialogOpen = $state(false);
let activeTab = $state('members');
let searchQuery = $state('');
let selectedRole = $state<'all' | keyof typeof OrganizationRoles>('all');
let selectedStatus = $state<'all' | keyof typeof InviteStatus>('all');

$effect(() => {
  if (activeTab) {
    searchQuery = '';
    selectedRole = 'all';
    selectedStatus = 'all';
  }
});

const OrganizationRoles = {
  member: 'Member',
  admin: 'Admin',
  owner: 'Owner',
};

const InviteStatus = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  canceled: 'Cancelled',
  rejected: 'Rejected',
};

// Filter functions
const filteredMembers = $derived.by(() => {
  let filtered = members;

  if (searchQuery) {
    filtered = filtered.filter(
      member =>
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedRole !== 'all') {
    filtered = filtered.filter(member => member.role.includes(selectedRole));
  }

  return filtered;
});

const filteredInvites = $derived.by(() => {
  let filtered = invites;

  if (searchQuery) {
    filtered = filtered.filter(invite =>
      invite.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedRole !== 'all') {
    filtered = filtered.filter(invite => invite.role.includes(selectedRole));
  }

  if (selectedStatus !== 'all') {
    filtered = filtered.filter(request => request.status === selectedStatus);
  }

  return filtered;
});

const filteredRequests = $derived.by(() => {
  let filtered = requests;

  if (searchQuery) {
    filtered = filtered.filter(
      request =>
        request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedRole !== 'all') {
    filtered = filtered.filter(request => request.role.includes(selectedRole));
  }

  if (selectedStatus !== 'all') {
    filtered = filtered.filter(request => request.status === selectedStatus);
  }

  return filtered;
});

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'accepted':
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'expired':
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'canceled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
}

function getRoleColor(role: string | string[]): string {
  if (role.includes('owner')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple/20';
  }
  if (role.includes('admin')) {
    return 'bg-primary/10 text-primary border-primary/20';
  }
  if (role.includes('member')) {
    return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
  }

  return 'bg-muted text-muted-foreground';
}

function displayRole(role: string): string {
  if (role.includes('owner')) {
    return 'Owner';
  }
  if (role.includes('admin')) {
    return 'Admin';
  }

  return 'Member';
}
</script>

<svelte:head>
  <title>Manage Members - Admin</title>
</svelte:head>

<div class="p-6 space-y-6">
  <!-- Header Section -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
    <div>
      <h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
        <Users class="h-8 w-8 text-primary"/>
        Team Management
      </h1>
      <p class="text-muted-foreground mt-1">
        Manage your organization members, invitations, and join requests
      </p>
    </div>

    {#if isSiteAdmin}
      <Button
          onclick={() => { sendDialogOpen = true; }}
          class="flex items-center gap-2"
      >
        <UserPlus class="h-4 w-4"/>
        Invite Member
      </Button>
    {/if}
  </div>

  <!-- Stats Overview -->
  <!-- //TODO: Move stats to the dashboard -->
<!--  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">-->
<!--    <Card>-->
<!--      <CardContent class="py-6 px-4">-->
<!--        <h2 class="text-base font-medium text-muted-foreground mb-2 text-center">Total Members</h2>-->
<!--        <div class="flex items-center justify-around">-->
<!--          <div>-->
<!--            <p class="text-3xl font-bold text-foreground">{totalMembers}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">-->
<!--            <Users class="h-6 w-6 text-primary"/>-->
<!--          </div>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="py-6 px-4">-->
<!--        <h2 class="text-base font-medium text-muted-foreground mb-2 text-center">Pending Requests</h2>-->
<!--        <div class="flex items-center justify-around">-->
<!--          <div>-->
<!--            <p class="text-3xl font-bold text-foreground">{pendingRequests}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">-->
<!--            <UserCheck class="h-6 w-6 text-green-600 dark:text-green-400"/>-->
<!--          </div>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="py-6 px-4">-->
<!--        <h2 class="text-base font-medium text-muted-foreground mb-2 text-center">Pending Invites</h2>-->
<!--        <div class="flex items-center justify-around">-->
<!--          <div>-->
<!--            <p class="text-3xl font-bold text-foreground">{pendingInvites}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">-->
<!--            <Clock class="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>-->
<!--          </div>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="py-6 px-4">-->
<!--        <h2 class="text-base font-medium text-muted-foreground mb-2 text-center">Total Invites</h2>-->
<!--        <div class="flex items-center justify-around">-->
<!--          <div>-->
<!--            <p class="text-3xl font-bold text-foreground">{totalInvites}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">-->
<!--            <Mail class="h-6 w-6 text-blue-600 dark:text-blue-400"/>-->
<!--          </div>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->
<!--  </div>-->
  {@render children()}
</div>

<!-- Invite Dialog -->
<Dialog bind:open={sendDialogOpen}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <UserPlus class="h-5 w-5"/>
        Invite Team Member
      </DialogTitle>
      <DialogDescription>
        Send an invitation to join your organization. They'll receive an email with instructions to get started.
      </DialogDescription>
    </DialogHeader>

    <form action="?/send-invite" method="POST" use:enhance class="space-y-4">
      <FormField form={sendInviteForm} name="email">
        <FormControl>
          {#snippet children( { props } )}
            <FormLabel>Email Address</FormLabel>
            <Input
                {...props}
                type="email"
                placeholder="colleague@company.com"
                bind:value={$sendInviteData.email}
            />
            <FieldErrors/>
          {/snippet}
        </FormControl>
      </FormField>

      {#if isSiteAdmin}
        <FormField form={sendInviteForm} name="role">
          <FormControl>
            {#snippet children( { props } )}
              <FormLabel>Role</FormLabel>
              <Select type="single" name="role" bind:value={$sendInviteData.role}>
                <SelectTrigger {...props}>
                  {$sendInviteData.role ? OrganizationRoles[$sendInviteData.role] : 'Select Role'}
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="member">
                    <div class="flex items-center gap-2">
                      <User class="h-4 w-4"/>
                      <div>
                        <p class="font-medium">Member</p>
                        <p class="text-xs text-muted-foreground">Can view and create forms</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div class="flex items-center gap-2">
                      <Crown class="h-4 w-4"/>
                      <div>
                        <p class="font-medium">Admin</p>
                        <p class="text-xs text-muted-foreground">Full access to manage organization</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldErrors/>
            {/snippet}
          </FormControl>
        </FormField>
      {/if}

      <Alert>
        <Mail class="h-4 w-4"/>
        <AlertDescription>
          An invitation email will be sent to this address with a secure link to join your organization.
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button type="button" variant="outline" onclick={() => { sendDialogOpen = false; }}>
          Cancel
        </Button>
        <Button type="submit" class="flex items-center gap-2">
          <Mail class="h-4 w-4"/>
          Send Invitation
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>