import { formFields, forms } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { type SQL, eq, inArray, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
  const text = await request.text();
  const data = JSON.parse(text);

  const inputs = data.sortedData;
  const formId = data.formId;

  // const id = data.get('id')?.toString();
  // if (!id) {
  //   return new Response(
  //     JSON.stringify({ success: false, error: 'id is missing' }),
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );
  // }
  //
  // let orderIndex: string | number | undefined = data
  //   .get('orderIndex')
  //   ?.toString();
  // if (!orderIndex) {
  //   return new Response(
  //     JSON.stringify({ success: false, error: 'orderIndex is missing' }),
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );
  // }
  try {
    // You have to be sure that inputs array is not empty
    if (inputs.length === 0) {
      return;
    }

    const sqlChunks: SQL[] = [];
    const ids: number[] = [];
    const timeSqlChunks: SQL[] = [];

    sqlChunks.push(sql`(case`);
    timeSqlChunks.push(sql`(case`);

    for (const input of inputs) {
      sqlChunks.push(
        sql`when ${formFields.id} = ${input.id} then ${input.orderIndex}`
      );
      timeSqlChunks.push(
        sql`when ${formFields.id} = ${input.id} then ${Date.now()}`
      );
      ids.push(input.id);
    }

    sqlChunks.push(sql`end)`);
    timeSqlChunks.push(sql`end)`);

    const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));
    const finalTimeSql: SQL = sql.join(timeSqlChunks, sql.raw(' '));

    await locals.db
      .update(formFields)
      .set({ orderIndex: finalSql, updatedAt: finalTimeSql })
      .where(inArray(formFields.id, ids));

    const survey = await locals.db
      .update(forms)
      .set({ updatedAt: new Date(Date.now()) })
      .where(eq(forms.id, formId))
      .returning({ updatedAt: forms.updatedAt });

    if (!survey || survey.length === 0) throw new Error('surey not found');

    return json({
      sucess: true,
      lastUpdated: survey[0].updatedAt,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
