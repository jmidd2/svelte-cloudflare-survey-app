<script lang="ts">
import {
  Calendar,
  CheckCircle,
  CheckCircleIcon,
  Clock,
  Crown,
  Filter,
  Mail,
  MoreHorizontal,
  Search,
  User,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { applyAction, enhance as stdEnhance } from '$app/forms';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import { Input } from '$lib/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$lib/components/ui/table';
import { Tabs, TabsContent } from '$lib/components/ui/tabs';
import { getInitials } from '$lib/utils';
import { sendInviteSchema } from '$lib/validation-schema';

const { data } = $props();

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

// UI State
let activeTab = $derived(page.params.tab || 'active');
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

  <!-- Search and Filter for Members -->
  <Card class="mb-4">
    <CardContent class="px-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input
              placeholder="Search members by name or email..."
              bind:value={searchQuery}
              class="pl-10"
          />
        </div>

        <Select type="single" bind:value={selectedRole}>
          <SelectTrigger class="w-full sm:w-48">
            <Filter class="h-4 w-4 mr-2"/>
            {selectedRole === 'all' ? 'All Roles' : OrganizationRoles[selectedRole]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {#each Object.entries(OrganizationRoles) as [value, label]}
              <SelectItem {value}>{label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>

        {#if activeTab !== 'active'}
          <Select type="single" bind:value={selectedStatus}>
            <SelectTrigger class="w-full sm:w-48">
              <Filter class="h-4 w-4 mr-2"/>
              {selectedStatus === 'all' ? 'All Statuses' : InviteStatus[selectedStatus]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {#each Object.entries(InviteStatus) as [value, label]}
                <SelectItem {value}>{label}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Tabbed Interface -->
  <Tabs bind:value={activeTab} class="w-full gap-y-0 dark:bg-spark-bg-dark">
    <!-- Members Tab -->
    <TabsContent value="active" class="space-y-6">
      <!-- Members Table -->
      <Card class="">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Users class="h-5 w-5"/>
            Active Members {#if searchQuery !== ''}({filteredMembers.length}/{data.currentMemberCount}){:else}({data.currentMemberCount}){/if}
          </CardTitle>
          <CardDescription>
            Current members of your organization
          </CardDescription>
        </CardHeader>
        <CardContent class="px-4">
          {#if filteredMembers.length > 0}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {#if canManageMembers}
                    <TableHead class="w-12"></TableHead>
                  {/if}
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each filteredMembers as member}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <Avatar class="h-10 w-10">
                          <AvatarImage src={member.image} alt={member.name}/>
                          <AvatarFallback class="bg-primary/10 text-primary font-medium">
                            {getInitials( member.name )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p class="font-medium text-foreground">{member.name}</p>
                          <p class="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2">
                        {#each member.role.split(',').sort((a, b) => {
                          if (a.includes('owner')) return -1;
                          if (b.includes('owner')) return 1;
                          if (a.includes('admin')) return -1;
                          if (b.includes('admin')) return 1;
                          return 0;
                        }) as r}
                          <Badge variant="outline" class={getRoleColor(r)}>
                            {#if r.includes('owner') || r.includes('admin')}
                              <Crown class="h-3 w-3 mr-1"/>
                            {:else}
                              <User class="h-3 w-3 mr-1"/>
                            {/if}
                            {displayRole(r)}
                          </Badge>
                        {/each}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar class="h-4 w-4"/>
                        {formatDate( member.createdAt )}
                      </div>
                    </TableCell>
                    {#if canManageMembers}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                              <MoreHorizontal class="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Edit Role</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem class="text-destructive" disabled>Remove Member</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    {:else}
                      <TableCell/>
                    {/if}
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
          {:else}
            <div class="p-8 text-center">
              <Users class="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <h3 class="text-lg font-medium text-foreground mb-2">No members found</h3>
              <p class="text-muted-foreground">
                {searchQuery || selectedRole !== 'all'
                 ? 'Try adjusting your search or filter criteria.'
                 : 'Start by inviting your first team member.'}
              </p>
            </div>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>

    <!-- Invitations Tab -->
    <TabsContent value="invitations" class="space-y-6">
      <!-- Invitations Table -->
      <Card class="">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Mail class="h-5 w-5"/>
            Invitations ({data.pendingInvites})
          </CardTitle>
          <CardDescription>
            Invitations sent to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent class="px-4">
          {#if filteredInvites.length > 0}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  {#if canManageInvites}
                    <TableHead class="w-12"></TableHead>
                  {/if}
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each filteredInvites as invite}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <Mail class="h-4 w-4 text-muted-foreground"/>
                        </div>
                        <div>
                          <p class="font-medium text-foreground">{invite.email}</p>
                          <p class="text-sm text-muted-foreground">Invitation {invite.status}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" class={getRoleColor(invite.role)}>
                        {#if invite.role === 'admin'}
                          <Crown class="h-3 w-3 mr-1"/>
                        {:else}
                          <User class="h-3 w-3 mr-1"/>
                        {/if}
                        {OrganizationRoles[invite.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge class={getStatusColor(invite.status)}>
                        {#if invite.status === 'pending'}
                          <Clock class="h-3 w-3 mr-1"/>
                        {:else if invite.status === 'accepted'}
                          <CheckCircle class="h-3 w-3 mr-1"/>
                        {:else}
                          <XCircle class="h-3 w-3 mr-1"/>
                        {/if}
                        {InviteStatus[invite.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar class="h-4 w-4"/>
                        {formatDate( invite.expiresAt )}
                      </div>
                    </TableCell>
                    {#if canManageInvites}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                              <MoreHorizontal class="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Resend Invitation</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem class="text-destructive">
                              <form method="POST" action="?/cancel-invite" class="inline" use:stdEnhance={() => {
                                return async ({update, result}) => {
                                  if (result.type === 'redirect') {
                                    goto(result.location);
                                  } else {
                                    if (result.type === 'success')
                                      toast.success('Invitation cancelled');
                                    else if (result.type === 'error' || result.type === 'failure')
                                      toast.error('Failed to cancel invitation');

                                    await update({invalidateAll: true});
                                    await applyAction(result);
                                  }
                                }
                              }}>
                                <input type="hidden" name="inviteId" value={invite.id}>
                                <button>Cancel Invitation</button>
                              </form>
                            </DropdownMenuItem>
                            {#if isSiteAdmin}
                              <DropdownMenuSeparator/>
                              <DropdownMenuItem class="text-destructive">
                                <form method="POST" action="?/remove-invite" class="inline" use:stdEnhance={() => {
                                  return async ({update, result}) => {
                                    if (result.type === 'redirect') {
                                      goto(result.location);
                                    } else {
                                      if (result.type === 'success')
                                        toast.success('Invitation deleted');
                                      else if (result.type === 'error' || result.type === 'failure')
                                        toast.error('Failed to delete invitation');

                                      await update({invalidateAll: true});
                                      await applyAction(result);
                                    }
                                  }
                                }}>
                                  <input type="hidden" name="inviteId" value={invite.id}>
                                  <button>Delete Invitation</button>
                                </form>
                              </DropdownMenuItem>
                            {/if}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    {:else}
                      <TableCell/>
                    {/if}
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
          {:else}
            <div class="p-8 text-center">
              <Mail class="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <h3 class="text-lg font-medium text-foreground mb-2">No invitations found</h3>
              <p class="text-muted-foreground mb-4">
                {searchQuery
                 ? 'No invitations match your search criteria.'
                 : 'No invitations have been sent yet.'}
              </p>
              {#if isSiteAdmin && !searchQuery}
                <Button onclick={() => { sendDialogOpen = true; }} variant="outline">
                  <UserPlus class="h-4 w-4 mr-2"/>
                  Send Invitation
                </Button>
              {/if}
            </div>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>

    <!-- Requests Tab -->
    <TabsContent value="requests" class="space-y-6">
      <!-- Requests Table -->
      <Card class="">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <UserCheck class="h-5 w-5"/>
            Join Requests ({data.pendingRequests})
          </CardTitle>
          <CardDescription>
            Users requesting to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent class="px-4">
          {#if filteredRequests.length > 0}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  {#if canManageMembers}
                    <TableHead class="w-32">Actions</TableHead>
                  {/if}
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each filteredRequests as request}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <Avatar class="h-10 w-10">
                          <AvatarImage src={request.user?.image} alt={request.user?.name}/>
                          <AvatarFallback class="bg-primary/10 text-primary font-medium">
                            {getInitials( request.user?.name || request.user?.email || 'U' )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p class="font-medium text-foreground">{request.user?.name || 'Unknown User'}</p>
                          <p class="text-sm text-muted-foreground">{request.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" class={getRoleColor(request.role || 'member')}>
                        {#if request.role === 'admin'}
                          <Crown class="h-3 w-3 mr-1"/>
                        {:else}
                          <User class="h-3 w-3 mr-1"/>
                        {/if}
                        {OrganizationRoles[request.role || 'member']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge class={getStatusColor(request.status)}>
                        {#if request.status === 'pending'}
                          <Clock class="h-3 w-3 mr-1"/>
                        {:else if request.status === 'accepted'}
                          <CheckCircle class="h-3 w-3 mr-1"/>
                        {:else}
                          <XCircle class="h-3 w-3 mr-1"/>
                        {/if}
                        {request.status === 'pending' ? 'Pending' : request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        {#if request.status === 'pending'}
                          <Calendar class="h-4 w-4"/>
                          {formatDate( request.expiresAt )}
                        {:else}
                          -
                        {/if}
                      </div>
                    </TableCell>
                    {#if canManageMembers && request.status === 'pending'}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                              <MoreHorizontal class="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <form method="POST" action="?/accept-request" class="inline" use:stdEnhance={() => {
                            return async ({update, result}) => {
                              if (result.type === 'success') {
                                toast.success('Request approved');
                              } else {
                                toast.error('Failed to approve request');
                              }
                              await update({invalidateAll: true});
                            }
                          }}>
                                <input type="hidden" name="requestId" value={request.id}>
                                <button type="submit">
                                  Approve
                                </button>
                              </form>
                            </DropdownMenuItem>
                            {#if isSiteAdmin}
                              <DropdownMenuSeparator/>
                              <DropdownMenuItem class="text-destructive">
                                <form method="POST" action="?/reject-request" class="inline" use:stdEnhance={() => {
                            return async ({update, result}) => {
                              if (result.type === 'success') {
                                toast.success('Request rejected');
                              } else {
                                toast.error('Failed to reject request');
                              }
                              await update({invalidateAll: true});
                            }
                          }}>
                                  <input type="hidden" name="requestId" value={request.id}>
                                  <button type="submit">
                                    Reject
                                  </button>
                                </form>
                              </DropdownMenuItem>
                            {/if}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    {:else}
                      <TableCell/>
                    {/if}
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
          {:else}
            <div class="p-8 text-center">
              <UserCheck class="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <h3 class="text-lg font-medium text-foreground mb-2">No join requests</h3>
              <p class="text-muted-foreground">
                {searchQuery
                 ? 'No requests match your search criteria.'
                 : 'No users have requested to join your organization yet.'}
              </p>
            </div>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>