import { z, ZodType, ZodTypeAny } from 'zod';
import shape from '../../shape';

const validatorSchema = z.object({
  method: z.union([z.literal('get'), z.literal('post'), z.literal('put'), z.literal('delete')]),
  auth: z.union([z.literal('YES'), z.literal('NO')]),
  path: z.string().startsWith('/'),
  body: z.instanceof(ZodType),
  params: z.instanceof(ZodType),
  query: z.instanceof(ZodType),
  response: z.instanceof(ZodType),
});

const makeSchema = <
  METHOD extends 'get' | 'post' | 'put' | 'delete',
  AUTH extends 'YES' | 'NO',
  PATH extends string,
  BODY extends ZodTypeAny,
  PARAMS extends ZodTypeAny,
  QUERY extends ZodTypeAny,
  RESPONSE extends ZodTypeAny
>(config: {
  method: METHOD;
  auth: AUTH;
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
  const path = all.shape.request.shape.path._def.value;
  const needAuthentication = all.shape.request.shape.auth._def.value == 'YES' ? true : false;
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
  const makeParamsShape = <ENTRY extends z.infer<typeof params>>(
    entry: ENTRY,
    orders: (keyof ENTRY)[]
  ) => {
    let parseResult = params.safeParse(entry);
    if (parseResult.success) {
      let shapeAsString = '';
      orders.forEach((item) => {
        shapeAsString = `${shapeAsString}/:${item as string}`;
      });
      return shapeAsString;
    } else {
      throw parseResult.error;
    }
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
      let shapeAsString = makeParamsShape(entry, orders);
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
    makeBody,
    makeParams,
    stringifyParams,
    makeQuery,
    makeRequestConfig,
    makeFullPath,
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
};
