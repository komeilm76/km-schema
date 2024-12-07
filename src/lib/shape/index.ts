import { jsonrepair } from 'jsonrepair';
import { AnyZodObject, z } from 'zod';

const paginationSchema = () => {
  return z.object({
    currentPage: z.number().min(1),
    totalItems: z.number().min(0),
    itemsPerPage: z.number().min(1),
  });
};

const jsonObject = <SCHEMA extends AnyZodObject>(schema: SCHEMA) => {
  return z
    .string()
    .transform((v) => {
      return JSON.parse(jsonrepair(v));
    })
    .pipe(schema);
};
export default {
  paginationSchema,
  jsonObject,
};
