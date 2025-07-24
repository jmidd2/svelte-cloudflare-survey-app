<script lang="ts">
  import {
    ArrowDown,
    ArrowLeft,
    Calendar,
    Download,
    Filter,
    Search,
    ChevronDown,
    X,
  } from "@lucide/svelte";
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import PopoverTrigger from "$lib/components/ui/popover/popover-trigger.svelte";
  import PopoverContent from "$lib/components/ui/popover/popover-content.svelte";
  import { Popover } from "$lib/components/ui/popover";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog/index.js";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import { AreaChart } from "layerchart";

  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import { curveNatural } from "d3-shape";
  import { scaleUtc } from "d3-scale";
  import { DropdownMenu } from "$lib/components/ui/dropdown-menu/index.js";
  import DropdownMenuTrigger from "$lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte";
  import DropdownMenuContent from "$lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuItem from "$lib/components/ui/dropdown-menu/dropdown-menu-item.svelte";

  const { data } = $props();
  console.log(data.responses);
  const survey = $derived(data.survey);
  const fields = $derived(data.responses || []); // Assuming the array of fields is in data.responses
  // const metrics = $derived(data.metrics);
  const LATEST_LIMIT = 3;

  let searchQuery = $state("");
  let selectedFields = $state(new Set(fields.map((field) => field.id))); // All fields selected by default
  let exportStyle = $state<"JSON" | "CSV">("JSON");

  // Transform the data structure to get all unique submissions
  const allSubmissions = $derived.by(() => {
    const submissionMap = new Map();

    fields.forEach((field) => {
      field.fieldSubmissions?.forEach((submission) => {
        const submissionId = submission.submissionId;
        if (!submissionMap.has(submissionId)) {
          submissionMap.set(submissionId, {
            id: submissionId,
            createdAt: submission.createdAt,
            fields: new Map(),
          });
        }

        submissionMap.get(submissionId).fields.set(field.id, {
          field: field,
          data: submission.data,
        });
      });
    });

    return Array.from(submissionMap.values());
  });

  $effect(() => {
    if (!searchQuery.trim()) {
      selectedFields = new Set(fields.map((field) => field.id));
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Find all fields that match the search query
    const matchingFieldIds = fields
      .filter((field) => field.label?.toLowerCase().includes(query))
      .map((field) => field.id);

    if (matchingFieldIds.length > 0) {
      selectedFields = new Set(matchingFieldIds);
    }
  });

  // Filter submissions based on search query and selected fields
  const filteredSubmissions = $derived.by(() => {
    if (!searchQuery.trim() && selectedFields.size === fields.length) {
      return allSubmissions;
    }

    const query = searchQuery.toLowerCase().trim();

    return allSubmissions.filter((submission) => {
      const hasSelectedFieldData = Array.from(selectedFields).some((fieldId) =>
        submission.fields.has(fieldId)
      );

      if (!hasSelectedFieldData) return false;
      if (!query) return true;

      return Array.from(submission.fields.values()).some((fieldData) => {
        if (!selectedFields.has(fieldData.field.id)) return false;
        const fieldLabel = fieldData.field.label?.toLowerCase() || "";
        return fieldLabel.includes(query);
      });
    });
  });

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getFieldValue(data: any, fieldType: string) {
    if (!data) return "-";

    switch (fieldType) {
      case "checkbox":
        // Assuming data could be an array or comma-separated string
        if (Array.isArray(data)) {
          return data.join(", ");
        }
        return data.toString();
      case "yes-no":
        return data ? "Yes" : "No";
      case "date":
        return formatDate(new Date(+data));
      default:
        return typeof data === "string"
          ? data.slice(0, 1).toUpperCase() + data.slice(1)
          : data?.toString() || "-";
    }
  }

  function toggleFieldSelection(fieldId: string) {
    if (selectedFields.has(fieldId)) {
      selectedFields.delete(fieldId);
    } else {
      selectedFields.add(fieldId);
    }
    selectedFields = new Set(selectedFields); // Trigger reactivity
  }

  const chartData = $derived(
    data.metrics.map((item) => ({
      ...item,
      monthYear: new Date(item.monthYear),
    }))
  );

  const chartConfig = {
    submissionCount: { label: "Submissions", color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig;

  function downloadJSON(data, filename = "data.json") {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
  }

  function convertToCSV(data){
    const headers = [
      'Field Id',
      'Field Label',
      'Field Submitted At',
      'Submission ID',
      'Response Data',
      'Response Created At',
    ];

    const csvRows = [headers.join(',')];

    data.forEach(field => {
      const fieldId = field.id;
      const fieldLabel = `${field.label}`;
      const fieldSubmittedAt = field.submittedAt instanceof Date
        ? field.submittedAt.toISOString()
        : field.submittedAt;

      if(!field.fieldSubmissions || field.fieldSubmissions.length === 0){
        csvRows.push([
          fieldId,
          fieldLabel,
          fieldSubmittedAt,
          '',
          '',
          ''
        ].join(','));
      } else {
        field.fieldSubmissions.forEach(submission => {
          const submissionId = submission.submissionId;
          const responseData = `"${(submission.data || '').replace(/"/g, '""')}"`;
          const responseCreatedAt = submission.createdAt instanceof Date
            ? submission.createdAt.toISOString()
            : submission.createdAt;

            csvRows.push([
              fieldId,
              fieldLabel,
              fieldSubmittedAt,
              submissionId,
              responseData,
              responseCreatedAt
            ]. join(','));
        });
      }
    });
    return csvRows.join('\n');
  }

  function downloadCSV(data, filename = '-response.csv'){
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function handleDownload() {
    switch (exportStyle) {
      case "JSON":
        return downloadJSON(fields, `${survey.title}-responses.json`);
      case "CSV":
        return downloadCSV(fields, `${survey.title}-responses.csv`);
    }
  }

</script>

<div class="h-[calc(100vh-65px)] flex flex-col overflow-hidden">
  <div class="flex-shrink-0 p-6 pb-0">
    <div class="flex justify-between items-center gap-4 mb-4">
      <Button
        variant="ghost"
        size="sm"
        href={`/admin/${data.tenant?.slug}/forms`}
        class="gap-2"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to Forms
      </Button>
      <div class="mr-4 flex items-center bg-secondary rounded-lg">
        <Button
          variant="secondary"
          size="default"
          class="gap-2"
          onclick={handleDownload}
        >
          <Download class="h-4 w-4" />
          Export Responses as {exportStyle}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            class="bg-secondary p-2 rounded-tr rounded-br h-9 flex items-center border-l w-10 mx-auto hover:bg-accent"
          >
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onclick={() => (exportStyle = "JSON")}
              >JSON</DropdownMenuItem
            >
            <DropdownMenuItem onclick={() => (exportStyle = "CSV")}
              >CSV</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div class="flex flex-col mb-6">
      <h1 class="text-3xl font-bold text-foreground">
        {survey.title} - Results
      </h1>
      <p class="text-muted-foreground mt-1">{survey.description}</p>
    </div>

    <div class="flex justify-center gap-x-4 mb-6">
      <Card class="bg-card px-8 py-6 flex flex-col">
        <p class="w-full text-left text-xl">Responses Per Month</p>
        <Chart.Container config={chartConfig} class="w-[300px]">
          <AreaChart
            data={chartData}
            x="monthYear"
            y="submissionCount"
            xScale={scaleUtc()}
            series={[
              {
                key: "submissionCount",
                label: "Submissions",
                color: chartConfig.submissionCount.color,
              },
            ]}
            axis="both"
            props={{
              area: {
                curve: curveNatural,
                "fill-opacity": 0.4,
                line: { class: "stroke-1" },
                motion: "tween",
              },
              xAxis: {
                format: (v: Date) =>
                  v.toLocaleDateString("en-US", { month: "short" }),
              },
              yAxis: {
                format: (d: number) => d.toString(),
                ticks: 1,
              },
            }}
          >
            {#snippet tooltip()}
              <Chart.Tooltip
                labelFormatter={(v: Date) =>
                  v.toLocaleDateString("en-US", { month: "long" })}
                indicator="line"
              />
            {/snippet}
          </AreaChart>
        </Chart.Container>
      </Card>
      <Card class="w-[400px]">
        <CardHeader>
          <p class="text-lg">Total Responses</p>
        </CardHeader>
        <div
          class="flex justify-center items-center content-center h-full mb-8"
        >
          <p class="text-4xl text-primary">{allSubmissions.length}</p>
        </div>
      </Card>
    </div>

    <Card class="mb-4 max-w-[50rem] mx-auto">
      <CardContent class="px-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              placeholder="Search results by question"
              bind:value={searchQuery}
              class="pl-10"
            />
          </div>

          <Popover>
            <PopoverTrigger
              class="w-full sm:w-48 inline-flex items-center justify-center gap-2 bg-accent border border-input rounded-md px-3 py-1 text-sm"
            >
              <Filter class="h-4 w-4" />
              Select Questions ({selectedFields.size}/{fields.length})
            </PopoverTrigger>
            <PopoverContent align="start" class="w-60">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-3">
                  Select questions to display:
                </div>
                {#each fields as field}
                  <div class="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedFields.has(field.id)}
                      onCheckedChange={() => toggleFieldSelection(field.id)}
                    />
                    <button
                      type="button"
                      class="text-sm text-start cursor-pointer flex-1"
                      onclick={() => toggleFieldSelection(field.id)}
                    >
                      {field.label}
                    </button>
                  </div>
                {/each}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Scrollable content section -->
  <div class="flex-1 overflow-y-auto px-6 pb-6">
    {#if searchQuery.length > 0}
      <p class="text-sm text-muted-foreground mb-4 text-center">
        Found {filteredSubmissions.length} result{filteredSubmissions.length !==
        1
          ? "s"
          : ""}
        {#if searchQuery}for "{searchQuery}"{/if}
      </p>
    {/if}

    <!-- Display results in a grid of tables, one per selected field -->
    <div
      class="mx-auto max-w-[50rem] grid lg:grid-cols-1 sm:grid-cols-1 xl:grid-cols-1 gap-4"
    >
      {#each fields.filter((field) => selectedFields.has(field.id)) as field}
        <Dialog>
          <Card>
            <CardHeader class="py-1">
              <h3 class="font-medium text-xl text-center">{field.label}</h3>
            </CardHeader>
            <CardContent class="p-0">
              <div class="max-h-96">
                <div class="grid grid-cols-[1fr_auto_1fr]">
                  <div class="content-center text-center text-2xl">
                    <div class="inline-flex items-end gap-x-2">
                      {searchQuery
                        ? filteredSubmissions.length
                        : field.fieldSubmissions.length}
                      {#if (searchQuery && filteredSubmissions.length > 1) || (!searchQuery && field.fieldSubmissions.length > 1)}
                        <p class="text-sm text-gray-400">submissions</p>
                      {:else}
                        <p class="text-sm text-gray-400">submission</p>
                      {/if}
                    </div>
                  </div>
                  <Separator orientation="vertical" />
                  <div>
                    <p class="mb-4 text-center italic text-sm">
                      Latest Responses:
                    </p>
                    <div class="">
                      <table class="w-90 mx-auto">
                        <tbody>
                          {#each filteredSubmissions
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .filter( (submission) => submission.fields.get(field.id) )
                            .slice(0, LATEST_LIMIT) as submission}
                            {@const fieldData = submission.fields.get(field.id)}
                            <tr
                              class="align-baseline border-b hover:bg-accent/40"
                            >
                              <td class="flex items-center gap-x-2 mt-1"
                                ><Calendar class="w-4 h-4" />{formatDate(
                                  submission.createdAt
                                )}</td
                              >
                              <td class="p-2 text-sm text-right font-medium">
                                {getFieldValue(fieldData.data, field.type)}
                              </td></tr
                            >
                          {/each}
                        </tbody>
                      </table>
                    </div>

                    {#if filteredSubmissions.filter( (s) => s.fields.has(field.id) ).length > 0}
                    <DialogTrigger class="w-full">
                      <div class="text-center mt-4">
                        <Button variant="outline">View All Responses</Button>
                      </div>
                    </DialogTrigger
                    >
                    {:else}
                      <div>
                        <p
                          colspan="2"
                          class="p-4 text-center text-muted-foreground text-sm"
                        >
                          No responses found
                        </p>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogContent class="max-h-[600px] flex flex-col">
            <DialogHeader class="flex-shrink-0 z-10">
              <DialogTitle>
                <h3 class="font-medium text-center">{field.label}</h3>
              </DialogTitle>
            </DialogHeader>
            <div class="flex-1 overflow-auto">
              <div class="w-full border rounded-xl">
                <table class="w-full">
                  <thead class="bg-accent">
                    <tr class="text-center">
                      <th class="py-1">#</th>
                      <th>Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each field.fieldSubmissions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) as entry, index}
                    <tr class="text-center">
                      <td class="border-r border-b py-2">{index + 1}</td>
                      <td class="border-b">
                        {field.type === "date" ? formatDate(+entry.data) : entry.data}
                      </td>
                    </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      {/each}
    </div>

    {#if filteredSubmissions.length === 0 && (searchQuery.length > 0 || selectedFields.size < fields.length)}
      <Card class="p-8 text-center max-w-[50rem] mx-auto">
        <p class="text-muted-foreground">
          No results found. Try adjusting your search or field selection.
        </p>
      </Card>
    {/if}
  </div>
</div>
