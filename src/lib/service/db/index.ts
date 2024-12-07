import mongoose from 'mongoose';
import { AnyZodObject, z, ZodObject } from 'zod';

const validatorSchema = z.object({
  key: z.string(),
  document: z.instanceof(ZodObject),
});

const makeSchema = <KEY extends string, DOCUMENT extends AnyZodObject>(config: {
  key: KEY;
  document: DOCUMENT;
}) => {
  validatorSchema.parse(config);
  const all = z.object({
    key: z.literal(`${config.key}`),
    fullKey: z.literal(`${config.key}s`),
    document: config.document,
    fullDocument: config.document.and(
      z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
        _id: z.instanceof(mongoose.Schema.ObjectId),
      })
    ),
  });

  const document = all.shape.document;
  const fullDocument = all.shape.fullDocument;
  const key = all.shape.key._def.value;
  const fullKey = all.shape.fullKey._def.value;

  return {
    all,
    document,
    fullDocument,
    key,
    fullKey,
  };
};

export default {
  makeSchema,
};
