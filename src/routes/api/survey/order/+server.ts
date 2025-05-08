import { formFields } from '$lib/server/db/schema';
import { type SQL, eq, inArray, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
  const data = await request.text();
  console.log('---------api--------', data);
  const inputs = JSON.parse(data);
  console.log('api', inputs);

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

    sqlChunks.push(sql`(case`);

    for (const input of inputs) {
      sqlChunks.push(
        sql`when ${formFields.id} = ${input.id} then ${input.orderIndex}`
      );
      ids.push(input.id);
    }

    sqlChunks.push(sql`end)`);

    const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

    await locals.db
      .update(formFields)
      .set({ orderIndex: finalSql })
      .where(inArray(formFields.id, ids));
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
