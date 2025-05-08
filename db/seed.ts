import * as schema from '$lib/server/db/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { reset, seed } from 'drizzle-seed';
import { tenants } from '../src/lib/server/db/schema';

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL });
  const db = drizzle(client, { schema });

  const test = await db.$count(schema.tenants);

  if (test > 0) await reset(db, schema);

  const formFieldLabels = [
    // Personal Information
    'Full Name',
    'First Name',
    'Last Name',
    'Email Address',
    'Phone Number',
    'Company Name',
    'Job Title',
    'Department',
    'Age',
    'Gender',
    'Location',
    'Country',
    'City',
    'Postal Code',
    'Address',

    // Feedback Specific
    'Overall Rating',
    'Satisfaction Level',
    'Would You Recommend Us',
    'Net Promoter Score',
    'How Likely Are You to Recommend Our Product',
    'Experience Rating',
    'What Did You Like Most',
    'What Could Be Improved',
    'Areas for Improvement',
    'Additional Comments',
    'Specific Suggestions',
    'Your Feedback',
    'Tell Us More',

    // Product Feedback
    'Product Quality',
    'Ease of Use',
    'Value for Money',
    'Features Used',
    'Missing Features',
    'Product Performance',
    'Product Reliability',
    'Product Design',
    'Which Features Do You Find Most Useful',
    'How Often Do You Use Our Product',
    'Which Alternative Products Did You Consider',

    // Service Feedback
    'Service Quality',
    'Response Time',
    'Staff Friendliness',
    'Issue Resolution',
    'Wait Time',
    'Support Experience',
    'How Quickly Was Your Issue Resolved',
    'Was Your Issue Completely Resolved',
    'Did Our Staff Meet Your Expectations',

    // Website Feedback
    'Website Usability',
    'Website Navigation',
    'Website Design',
    'Website Speed',
    'Mobile Experience',
    'Search Functionality',
    'Content Quality',
    'Information Clarity',
    'How Easy Was It to Find What You Were Looking For',

    // Event Feedback
    'Event Satisfaction',
    'Speaker Quality',
    'Content Relevance',
    'Venue Rating',
    'Event Organization',
    'Would You Attend a Similar Event',
    'Most Valuable Session',
    'Least Valuable Session',
    'How Did You Hear About This Event',

    // Course/Training Feedback
    'Course Content',
    'Instructor Knowledge',
    'Instructor Presentation Skills',
    'Materials Quality',
    'Pace of Training',
    'Course Relevance to Your Job',
    'What Topics Would You Like to See Added',
    'Would You Take Another Course With Us',

    // Customer Support Feedback
    'Support Staff Knowledge',
    'Support Staff Friendliness',
    'Issue Resolution',
    'Wait Time',
    'First Contact Resolution',
    'Support Channel Preference',
    'How Could We Improve Our Support',

    // Demographic Questions
    'Age Range',
    'Industry',
    'Company Size',
    'Role in Company',
    'How Long Have You Been a Customer',
    'How Often Do You Use Our Services',

    // Open-Ended Questions
    'What Features Would You Like to See',
    'How Can We Better Serve You',
    'Any Additional Comments',
    'What Would Make This Better',
    'What Was Missing From Your Experience',
    'Describe Your Ideal Experience',
    'What Problem Were You Trying to Solve',

    // Consent and Contact
    'May We Contact You About Your Feedback',
    'Preferred Contact Method',
    'Best Time to Contact You',
    'Would You Like to Join Our Focus Group',
    'May We Share Your Feedback Publicly',
    'Would You Like to Receive Our Newsletter',

    // Call to Action
    'Next Steps',
    'Preferred Solution',
    'Action Items',
    'Follow-Up Preference',
    'Priority Level',
  ];

  const tenantNames = [
    'Blue Ocean Solutions',
    'Sierra Analytics',
    'Horizon Industries',
    'Pulse Metrics',
    'Nova Systems',
    'Emerald Insights',
    'Apex Consulting',
    'Catalyst Research',
    'Quantum Dynamics',
  ];

  await seed(db, schema).refine(f => {
    return {
      formFields: {
        columns: {
          id: f.uuid(),
          type: f.valuesFromArray({
            values: ['text', 'radio', 'checkbox', 'select'],
          }),
          label: f.valuesFromArray({ values: formFieldLabels }),
          placeholder: f.valuesFromArray({ values: formFieldLabels }),
          required: f.boolean(),
          options: f.json({ arraySize: 3 }),
          orderIndex: f.int({ maxValue: 50, minValue: 0 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      forms: {
        columns: {
          id: f.uuid(),
          title: f.valuesFromArray({ values: ['Course Feedback', 'Survey'] }),
          description: f.loremIpsum({ sentencesCount: 1 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          createdBy: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
          // settings: {},
          active: f.default({ defaultValue: true }),
          settings: f.json(),
        },
        with: {
          formFields: 4,
          submissions: 3,
        },
      },
      submissions: {
        columns: {
          id: f.uuid(),
          data: f.json({ arraySize: 3 }),
          // ipHash: {},
          // userAgentHash: {},
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      tenants: {
        columns: {
          id: f.uuid(),
          name: f.default({ defaultValue: 'Phoenix Spark' }),
          active: f.default({ defaultValue: true }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
        with: {
          forms: 2,
        },
        count: 1,
      },
    };
  });

  await seed(db, schema, { seed: 12345 }).refine(f => {
    return {
      formFields: {
        columns: {
          id: f.uuid(),
          type: f.valuesFromArray({
            values: ['text', 'radio', 'checkbox', 'select'],
          }),
          label: f.valuesFromArray({ values: formFieldLabels }),
          placeholder: f.valuesFromArray({ values: formFieldLabels }),
          required: f.boolean(),
          options: f.json({ arraySize: 3 }),
          orderIndex: f.int({ maxValue: 50, minValue: 0 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      forms: {
        columns: {
          id: f.uuid(),
          title: f.valuesFromArray({ values: ['Course Feedback', 'Survey'] }),
          description: f.loremIpsum({ sentencesCount: 1 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          createdBy: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
          // settings: {},
          active: f.default({ defaultValue: true }),
          settings: f.json(),
        },
        with: {
          formFields: 4,
          submissions: 3,
        },
      },
      submissions: {
        columns: {
          id: f.uuid(),
          data: f.json({ arraySize: 3 }),
          // ipHash: {},
          // userAgentHash: {},
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      tenants: {
        columns: {
          id: f.uuid(),
          name: f.valuesFromArray({ values: tenantNames, isUnique: true }),
          active: f.default({ defaultValue: true }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
        with: {
          forms: 2,
        },
        count: 3,
      },
    };
  });
}

main();
