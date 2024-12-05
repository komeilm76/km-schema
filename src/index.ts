import { z } from 'zod';
import lib from './lib';
const kmSchema = lib;
export default kmSchema;

let apiExample = kmSchema.api.makeSchema({
  auth: 'YES',
  path: '/sss',
  method: 'get',
  body: z.object({}),
  params: z.object({
    pageSize: z.number(),
    currentPage: z.number(),
  }),
  query: z.object({
    isMarid: z.boolean(),
  }),
  response: kmSchema.api
    .responseShape(
      z.object({
        name: z.string(),
        age: z.number(),
        isMarid: z.boolean(),
      })
    )
    .list()
    .simple(),
});

let params = apiExample.makeFullPath({ currentPage: 10, pageSize: 12 }, [
  'pageSize',
  'currentPage',
]);
console.log('params', params);

let commadExample = kmSchema.command.makeSchema({
  key: 'start',
  body: z.string(),
  params: z.object({
    global: z.boolean(),
    flat: z.literal('UAE'),
  }),
  response: z.object({}),
});
let commandParams = commadExample.makeFullPath({ global: true, flat: 'UAE' });

console.log('commandParams', commandParams);
