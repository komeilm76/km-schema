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
    entryDocument: config.document,
    entryDocumentWithId: config.document.and(
      z.object({
        _id: z.instanceof(mongoose.Schema.ObjectId),
      })
    ),
    entryDocumentWithDate: config.document.and(
      z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
      })
    ),
    fullDocument: config.document.and(
      z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
        _id: z.instanceof(mongoose.Schema.ObjectId),
      })
    ),
  });

  const entryDocument = all.shape.entryDocument;
  const entryDocumentWithId = all.shape.entryDocumentWithId;
  const entryDocumentWithDate = all.shape.entryDocumentWithDate;
  const fullDocument = all.shape.fullDocument;
  const key = all.shape.key._def.value;
  const fullKey = all.shape.fullKey._def.value;

  return {
    all,
    entryDocument,
    entryDocumentWithId,
    entryDocumentWithDate,
    fullDocument,
    key,
    fullKey,
  };
};

export default {
  makeSchema,
};
