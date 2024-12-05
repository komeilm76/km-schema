import { z, ZodType, ZodTypeAny } from 'zod';

const validatorSchema = z.object({
  key: z.string(),
  body: z.instanceof(ZodType),
  params: z.instanceof(ZodType),
  response: z.instanceof(ZodType),
});

const makeSchema = <
  KEY extends string,
  BODY extends ZodTypeAny,
  PARAMS extends ZodTypeAny,
  RESPONSE extends ZodTypeAny
>(config: {
  key: KEY;
  body: BODY;
  params: PARAMS;
  response: RESPONSE;
}) => {
  validatorSchema.parse(config);
  const all = z.object({
    request: z.object({
      key: z.literal(`${config.key}`),
      fullKey: z.literal(`/${config.key}`),
      body: config.body,
      params: config.params,
    }),
    response: config.response,
  });
  const request = all.shape.request;
  const requestConfig = all.shape.request.pick({
    body: true,
    params: true,
  });
  const body = all.shape.request.shape.body;
  const params = all.shape.request.shape.params;
  const key = all.shape.request.shape.key._def.value;
  const fullKey = all.shape.request.shape.fullKey._def.value;
  const response = all.shape.response;

  const makeBody = <ENTRY extends z.infer<typeof body>>(entry: ENTRY) => {
    let parseResult = body.safeParse(entry);
    if (parseResult.success) {
      return parseResult.data as ENTRY;
    } else {
      throw parseResult.error;
    }
  };
  const makeParams = <ENTRY extends z.infer<typeof params>>(entry: ENTRY) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      return parseResult.data as ENTRY;
    } else {
      throw parseResult.error;
    }
  };

  const stringifyParams = <ENTRY extends z.infer<typeof params>>(entry: ENTRY) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let entryAsArray = Object.entries(entry);
      let finalOutput = '';
      let finalShape = '';
      entryAsArray.forEach((item) => {
        let key = item[0];
        let value = item[1];
        let output = `--${key}=${value}`;
        let outputShape = `--${key}=${typeof value}`;
        finalOutput = `${finalOutput}${output}`;
        finalShape = `${finalShape}${outputShape}`;
      });
      return {
        shape: finalShape,
        value: finalOutput,
      };
    } else {
      throw parseResult.error;
    }
  };

  const makeRequestConfig = <ENTRY extends z.infer<typeof requestConfig>>(entry: ENTRY) => {
    let parseResult = requestConfig.safeParse(entry);
    if (parseResult.success) {
      return parseResult.data as ENTRY;
    } else {
      throw parseResult.error;
    }
  };

  const makeResponse = <ENTRY extends z.infer<typeof response>>(entry: ENTRY) => {
    let parseResult = response.safeParse(entry);
    if (parseResult.success) {
      return parseResult.data as ENTRY;
    } else {
      throw parseResult.error;
    }
  };

  const makeFullPath = <ENTRY extends z.infer<typeof params>>(entry: ENTRY) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let paramAsString = stringifyParams(entry).value;
      return `${key} ${paramAsString}`;
    } else {
      throw parseResult.error;
    }
  };

  return {
    all,
    request,
    requestConfig,
    body,
    params,
    key,
    fullKey,
    response,
    stringifyParams,
    makeBody,
    makeParams,
    makeRequestConfig,
    makeResponse,
    makeFullPath,
  };
};

const paginationSchema = z.object({
  currentPage: z.number().min(1),
  totalItems: z.number().min(0),
  itemsPerPage: z.number().min(1),
});

const responseShape = <DATA extends ZodTypeAny>(data: DATA) => {
  const item = () => {
    return z.object({
      data: data,
    });
  };
  const list = () => {
    return {
      simple: () => {
        return z.object({
          data: data.array(),
        });
      },
      withPagination: () => {
        return z.object({
          pagination: paginationSchema,
          data: data.array(),
        });
      },
    };
  };
  return {
    data: () => data,
    item,
    list,
  };
};

export default {
  makeSchema,
  responseShape,
};