import { jsonrepair } from 'jsonrepair';
import mongoose from 'mongoose';
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

const objectId = () => {
  return z
    .union([z.instanceof(mongoose.Types.ObjectId), z.string()])
    .transform((v) => {
      if (v instanceof mongoose.Types.ObjectId) {
        return v;
      } else {
        let isValid = mongoose.isValidObjectId(v);
        if (isValid) {
          return new mongoose.Types.ObjectId(v);
        } else {
          return v;
        }
      }
    })
    .pipe(z.instanceof(mongoose.Types.ObjectId));
};
export default {
  paginationSchema,
  jsonObject,
  objectId,
};
