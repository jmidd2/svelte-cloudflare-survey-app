# Using Cloudflare Analytics Engine for Form Metrics

This guide explains how to track form metrics using Cloudflare Analytics Engine instead of storing view data in D1.

## Analytics Engine Overview

Cloudflare Analytics Engine is a purpose-built time-series database that's ideal for tracking metrics and events. It's
perfect for collecting form views, user interactions, and other analytics without the overhead of storing this data in
your primary database.

## Setting Up Analytics Engine

Analytics Engine is automatically available in your Worker environment through the `ANALYTICS` binding defined in your
wrangler.toml:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

No additional setup is required - Analytics Engine creates the dataset when you first write to it.

## Tracking Form Views

### Form View Tracking Function

Create a utility function to record form views in Analytics Engine:

```typescript
// src/lib/analytics/index.ts

/**
 * Record a form view in Analytics Engine
 */
export function recordFormView(
  analytics: AnalyticsEngineDataset,
  data: {
    formId: string;
    tenantId: string;
    userAgent?: string;
    referer?: string;
    country?: string;
  }
) {
  // Write the data point to Analytics Engine
  analytics.writeDataPoint({
    blobs: [
      data.formId,
      data.tenantId,
      data.userAgent || '',
      data.referer || ''
    ],
    doubles: [1], // Count of views
    indexes: ['form_view']
  });
}
```

### Implementation in Form Routes

Integrate view tracking in your form display route:

```typescript
// src/app/routes/forms/[id]/+page.server.ts
import {error} from '@sveltejs/kit';
import {createDb, getFormById, getFormFields} from '$lib/db';
import {recordFormView} from '$lib/analytics';

export async function load({params, request, platform}) {
  const formId = params.id;

  // Create database client
  const db = createDb(platform.env);

  // Get form details - no tenant ID check for public forms
  const form = await getFormById(db, formId);

  if (!form || !form.active) {
    throw error(constants.HTTP_STATUS_NOT_FOUND, 'Form not found');
  }

  // Get form fields
  const fields = await getFormFields(db, formId);

  // Track form view in Analytics Engine
  recordFormView(platform.env.ANALYTICS, {
    formId,
    tenantId: form.tenantId,
    userAgent: request.headers.get('user-agent') || undefined,
    referer: request.headers.get('referer') || undefined,
    country: request.headers.get('cf-ipcountry') || undefined
  });

  return {
    form,
    fields
  };
}
```

## Tracking Form Submissions

Track submissions in a similar way:

```typescript
// src/lib/analytics/index.ts

/**
 * Record a form submission in Analytics Engine
 */
export function recordFormSubmission(
  analytics: AnalyticsEngineDataset,
  data: {
    formId: string;
    tenantId: string;
    fieldCount: number;
    success: boolean;
  }
) {
  // Write the data point to Analytics Engine
  analytics.writeDataPoint({
    blobs: [
      data.formId,
      data.tenantId,
      data.success ? 'success' : 'failure'
    ],
    doubles: [1, data.fieldCount], // Count and number of fields
    indexes: ['form_submission']
  });
}
```

Then use this in your submission endpoint:

```typescript
// Inside form submission handler
recordFormSubmission(platform.env.ANALYTICS, {
  formId,
  tenantId: form.tenantId,
  fieldCount: Object.keys(formData).length,
  success: true
});
```

## Tracking User Actions

Track user interactions with the form:

```typescript
/**
 * Record a user action in Analytics Engine
 */
export function recordUserAction(
  analytics: AnalyticsEngineDataset,
  data: {
    formId: string;
    tenantId: string;
    action: string; // 'field_focus', 'field_blur', 'form_start', etc.
    fieldId?: string;
  }
) {
  // Write the data point to Analytics Engine
  analytics.writeDataPoint({
    blobs: [
      data.formId,
      data.tenantId,
      data.action,
      data.fieldId || ''
    ],
    doubles: [1], // Count of actions
    indexes: ['user_action']
  });
}
```

## Creating a Client-Side Tracker

For more detailed user interaction tracking, create a client-side tracker:

```typescript
// src/lib/analytics/client.ts

/**
 * Client-side analytics tracker
 */
export class FormAnalytics {
  private formId: string;
  private startTime: number;
  private events: Array<{
    type: string;
    fieldId?: string;
    timestamp: number;
  }> = [];

  constructor(formId: string) {
    this.formId = formId;
    this.startTime = Date.now();

    // Track form start
    this.trackEvent('form_view');
  }

  /**
   * Track a form event
   */
  trackEvent(type: string, fieldId?: string) {
    this.events.push({
      type,
      fieldId,
      timestamp: Date.now()
    });

    // Send the event to the server
    this.sendEvent(type, fieldId);
  }

  /**
   * Send an event to the server
   */
  private sendEvent(type: string, fieldId?: string) {
    const data = {
      formId: this.formId,
      action: type,
      fieldId
    };

    // Use beacon API for better performance
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(data));
    } else {
      // Fallback to fetch
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        keepalive: true
      });
    }
  }

  /**
   * Track form completion
   */
  trackCompletion(success: boolean) {
    const duration = Date.now() - this.startTime;

    this.trackEvent(success ? 'form_submit_success' : 'form_submit_failure');

    // Send completion data
    const data = {
      formId: this.formId,
      action: 'form_complete',
      duration,
      success,
      eventCount: this.events.length
    };

    // Use beacon API for better performance
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/complete', JSON.stringify(data));
    } else {
      // Fallback to fetch
      fetch('/api/analytics/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        keepalive: true
      });
    }
  }
}
```

## Analytics API Endpoints

Create endpoints to receive analytics events:

```typescript
// src/app/routes/api/analytics/+server.ts
import {json} from '@sveltejs/kit';
import {createDb, getFormById} from '$lib/db';
import {recordUserAction} from '$lib/analytics';

export async function POST({request, platform}) {
  try {
    const data = await request.json();
    const {formId, action, fieldId} = data;

    if (!formId || !action) {
      return json({error: 'Missing required fields'}, {status: 400});
    }

    // Get form for tenant ID
    const db = createDb(platform.env);
    const form = await getFormById(db, formId);

    if (!form) {
      return json({error: 'Form not found'}, {status: constants.HTTP_STATUS_NOT_FOUND});
    }

    // Record the action
    recordUserAction(platform.env.ANALYTICS, {
      formId,
      tenantId: form.tenantId,
      action,
      fieldId
    });

    return json({success: true});
  } catch (error) {
    console.error('Error recording analytics:', error);
    return json({error: 'Failed to record analytics'}, {status: 500});
  }
}
```

## Querying Analytics Data

Create a dashboard API endpoint to retrieve analytics data:

```typescript
// src/app/routes/api/dashboard/analytics/+server.ts
import {json} from '@sveltejs/kit';
import {protectTenantRoute} from '$lib/auth/protectRoute';

export async function GET(event) {
  // Verify tenant access
  const tenantId = await protectTenantRoute(event);

  // Get query parameters
  const url = new URL(event.request.url);
  const formId = url.searchParams.get('formId');
  const period = url.searchParams.get('period') || '7d'; // Default to 7 days

  if (!formId) {
    return json({error: 'Form ID is required'}, {status: 400});
  }

  try {
    // Query Analytics Engine for views
    const viewsQuery = `
      SELECT count() as views
      FROM ANALYTICS
      WHERE blob1 = '${formId}'
        AND blob2 = '${tenantId}'
        AND index = 'form_view'
        AND timestamp > now() - interval '${period}'
    `;

    const viewsResult = await event.platform.env.ANALYTICS.query(viewsQuery);

    // Query Analytics Engine for submissions
    const submissionsQuery = `
      SELECT count() as submissions
      FROM ANALYTICS
      WHERE blob1 = '${formId}'
        AND blob2 = '${tenantId}'
        AND index = 'form_submission'
        AND timestamp > now() - interval '${period}'
    `;

    const submissionsResult = await event.platform.env.ANALYTICS.query(submissionsQuery);

    // Query Analytics Engine for conversion rate over time
    const conversionQuery = `
      SELECT date_trunc('day', timestamp) as day,
             count_distinct(slice(blob1, 0, 8)) as unique_visitors,
             count(*) FILTER(WHERE index = 'form_submission' AND blob3 = 'success') as conversions
      FROM ANALYTICS
      WHERE blob1 = '${formId}'
        AND blob2 = '${tenantId}'
        AND (index = 'form_view' OR index = 'form_submission')
        AND timestamp > now() - interval '${period}'
      GROUP BY 1
      ORDER BY 1
    `;

    const conversionResult = await event.platform.env.ANALYTICS.query(conversionQuery);

    return json({
      views: viewsResult.data[0]?.views || 0,
      submissions: submissionsResult.data[0]?.submissions || 0,
      conversionRate: viewsResult.data[0]?.views ?
        (submissionsResult.data[0]?.submissions / viewsResult.data[0]?.views) * 100 : 0,
      timeline: conversionResult.data
    });
  } catch (error) {
    console.error('Error querying analytics:', error);
    return json({error: 'Failed to query analytics'}, {status: 500});
  }
}
```

## Analytics Dashboard Components

Create components to display analytics data:

```sveltehtml
<!-- src/lib/components/admin/FormAnalytics.svelte -->
<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let formId;

  let loading = true;
  let error = null;
  let analytics = null;
  let period = '7d'; // Default to 7 days

  // Fetch analytics data
  async function fetchAnalytics() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`/api/dashboard/analytics?formId=${formId}&period=${period}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      analytics = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  // Change time period
  function changePeriod(newPeriod) {
    period = newPeriod;
    fetchAnalytics();
  }

  onMount(() => {
    fetchAnalytics();
  });
</script>

<div class="analytics-container">
  <header>
    <h2>Form Analytics</h2>

    <div class="period-selector">
      <button
          class:active={period === '1d'}
          on:click={() => changePeriod('1d')}
      >
        24 Hours
      </button>
      <button
          class:active={period === '7d'}
          on:click={() => changePeriod('7d')}
      >
        7 Days
      </button>
      <button
          class:active={period === '30d'}
          on:click={() => changePeriod('30d')}
      >
        30 Days
      </button>
      <button
          class:active={period === '90d'}
          on:click={() => changePeriod('90d')}
      >
        90 Days
      </button>
    </div>
  </header>

  {#if loading}
    <div class="loading">
      <p>Loading analytics data...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
      <button on:click={fetchAnalytics}>Try Again</button>
    </div>
  {:else if analytics}
    <div class="metrics" transition:fade={{ duration: 200 }}>
      <div class="metric-card">
        <h3>Views</h3>
        <div class="metric-value">{analytics.views}</div>
      </div>

      <div class="metric-card">
        <h3>Submissions</h3>
        <div class="metric-value">{analytics.submissions}</div>
      </div>

      <div class="metric-card">
        <h3>Conversion Rate</h3>
        <div class="metric-value">{analytics.conversionRate.toFixed(2)}%</div>
      </div>
    </div>

    <!-- Timeline chart would go here -->
    {#if analytics.timeline && analytics.timeline.length > 0}
      <div class="timeline-chart">
        <!-- Implement chart using a library like Chart.js -->
      </div>
    {:else}
      <div class="no-data">
        <p>No timeline data available for the selected period.</p>
      </div>
    {/if}
  {:else}
    <div class="no-data">
      <p>No analytics data available.</p>
    </div>
  {/if}
</div>

<style>
  .analytics-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .period-selector {
    display: flex;
    gap: 0.5rem;
  }

  .period-selector button {
    background-color: #f3f4f6;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .period-selector button.active {
    background-color: #4f46e5;
    color: white;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background-color: #f9fafb;
    border-radius: 6px;
    padding: 1.5rem;
    text-align: center;
  }

  .metric-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #6b7280;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 600;
    color: #111827;
  }

  .timeline-chart {
    height: 300px;
    background-color: #f9fafb;
    border-radius: 6px;
    padding: 1.5rem;
  }

  .loading, .error, .no-data {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .error {
    color: #ef4444;
  }
</style>
```

## Benefits of Using Analytics Engine

1. **Scalability**: Analytics Engine scales to handle large volumes of events without impacting your D1 database
   performance.

2. **Performance**: Writing to Analytics Engine is faster than writing to D1, especially for high-frequency events like
   form views.

3. **Cost-Effective**: Analytics Engine is optimized for time-series data and metrics, making it more cost-effective
   than storing this data in D1.

4. **Query Flexibility**: Analytics Engine supports SQL-like queries specifically designed for time-series analysis.

5. **Real-Time Insights**: Analytics Engine provides near real-time querying capabilities for your dashboard.

By using Analytics Engine for metrics and D1 for your core application data, you get the best of both worlds: fast,
scalable analytics alongside reliable, structured data storage.