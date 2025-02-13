import { z, ZodType, ZodTypeAny } from 'zod';
import shape from '../../shape';

const apiMethodSchema = z.union([
  z.literal('get'),
  z.literal('post'),
  z.literal('put'),
  z.literal('delete'),
  z.literal('head'),
  z.literal('options'),
  z.literal('patch'),
]);

const apiAuthStatusSchema = z.union([z.literal('YES'), z.literal('NO')]);

const validatorSchema = z.object({
  method: apiMethodSchema,
  auth: apiAuthStatusSchema,
  path: z.string().startsWith('/'),
  body: z.instanceof(ZodType),
  params: z.instanceof(ZodType),
  query: z.instanceof(ZodType),
  response: z.instanceof(ZodType),
});

const makeSchema = <
  METHOD extends 'get' | 'post' | 'put' | 'delete',
  AUTH extends 'YES' | 'NO',
  DISABLE extends 'YES' | 'NO',
  PATH extends string,
  BODY extends ZodTypeAny,
  PARAMS extends ZodTypeAny,
  QUERY extends ZodTypeAny,
  RESPONSE extends ZodTypeAny
>(config: {
  method: METHOD;
  auth: AUTH;
  disable: DISABLE;
  path: PATH;
  body: BODY;
  params: PARAMS;
  query: QUERY;
  response: RESPONSE;
}) => {
  validatorSchema.parse(config);
  const all = z.object({
    request: z.object({
      method: z.literal(config.method),
      auth: z.literal(config.auth),
      disable: z.literal(config.disable),
      path: z.literal(config.path),
      body: config.body,
      params: config.params,
      query: config.query,
    }),
    response: config.response,
  });
  const request = all.shape.request;
  const requestConfig = all.shape.request.pick({
    body: true,
    params: true,
    query: true,
  });
  const body = all.shape.request.shape.body;
  const params = all.shape.request.shape.params;
  const query = all.shape.request.shape.query;
  const method = all.shape.request.shape.method._def.value;
  const auth = all.shape.request.shape.auth._def.value;
  const needAuthentication = all.shape.request.shape.auth._def.value == 'YES' ? true : false;
  const disable = all.shape.request.shape.disable._def.value;
  const isDisabled = all.shape.request.shape.disable._def.value == 'YES' ? true : false;
  const path = all.shape.request.shape.path._def.value;
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
  const makeParamsShape = <ENTRY extends z.infer<typeof params>>(orders: (keyof ENTRY)[]) => {
    let shapeAsString = '';
    orders.forEach((item) => {
      shapeAsString = `${shapeAsString}/:${item as string}`;
    });
    return shapeAsString;
  };
  const makeParamsString = <ENTRY extends z.infer<typeof params>>(
    entry: ENTRY,
    orders: (keyof ENTRY)[]
  ) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let paramAsString = '';
      orders.forEach((item) => {
        paramAsString = `${paramAsString}/${entry[item]}`;
      });
      return paramAsString;
    } else {
      throw parseResult.error;
    }
  };
  const stringifyParams = <ENTRY extends z.infer<typeof params>>(
    entry: ENTRY,
    orders: (keyof ENTRY)[]
  ) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let paramAsString = makeParamsString(entry, orders);
      let shapeAsString = makeParamsShape(orders);
      return {
        shape: shapeAsString,
        value: paramAsString,
      };
    } else {
      throw parseResult.error;
    }
  };
  const makeQuery = <ENTRY extends z.infer<typeof query>>(entry: ENTRY) => {
    let parseResult = query.safeParse(entry);
    if (parseResult.success) {
      return parseResult.data as ENTRY;
    } else {
      throw parseResult.error;
    }
  };

  const makeRequestConfig = <
    ENTRY_BODY extends z.infer<typeof body>,
    ENTRY_PARAMS extends z.infer<typeof params>,
    ENTRY_QUERY extends z.infer<typeof query>
  >(entry: {
    body: ENTRY_BODY;
    params: ENTRY_PARAMS;
    query: ENTRY_QUERY;
  }) => {
    let parseResultOfBody = requestConfig.safeParse(entry.body);
    let parseResultOfParams = requestConfig.safeParse(entry.params);
    let parseResultOfQuery = requestConfig.safeParse(entry.query);
    if (parseResultOfBody.success && parseResultOfParams.success && parseResultOfQuery.success) {
      return {
        body: parseResultOfBody.data,
        params: parseResultOfParams.data,
        query: parseResultOfQuery.data,
      } as { body: ENTRY_BODY; params: ENTRY_PARAMS; query: ENTRY_QUERY };
    } else {
      throw parseResultOfBody.error;
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

  const makeFullPath = <ENTRY extends z.infer<typeof params>>(
    entry: ENTRY,
    orders: (keyof ENTRY)[]
  ) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let paramAsString = makeParamsString(entry, orders);

      return `${path}${paramAsString}`;
    } else {
      throw parseResult.error;
    }
  };

  const makeFullPathShape = <ENTRY extends z.infer<typeof params>>(orders: (keyof ENTRY)[]) => {
    let paramAsString = makeParamsShape(orders);
    return `${path}${paramAsString}`;
  };

  return {
    all,
    request,
    requestConfig,
    body,
    params,
    query,
    method,
    path,
    response,
    auth,
    needAuthentication,
    disable,
    isDisabled,
    makeBody,
    makeQuery,
    makeRequestConfig,

    makeFullPath,
    makeFullPathShape,

    makeParams,
    stringifyParams,
    makeParamsString,
    makeParamsShape,

    makeResponse,
  };
};

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
          pagination: shape.paginationSchema(),
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
  // apiOutputShapeSchema,
  apiMethodSchema,
  apiAuthStatusSchema,
};
