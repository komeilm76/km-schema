

import { AnyZodObject, z, ZodTypeAny } from "zod";

const makeSchema = <
    METHOD extends "get" | "post" | "put" | "delete",
    AUTH extends "YES" | "NO",
    BASEURL extends string,
    BODY extends ZodTypeAny,
    PARAMS extends AnyZodObject,
    QUERY extends AnyZodObject,
    RESPONSE extends ZodTypeAny
>(config: {
    method: METHOD;
    auth: AUTH;
    baseUrl: BASEURL;
    body: BODY;
    params: PARAMS;
    query: QUERY;
    response: RESPONSE;
}) => {
    const full = z.object({
        request: z.object({
            method: z.literal(config.method),
            auth: z.literal(config.auth),
            baseUrl: z.literal(config.baseUrl),
            body: config.body,
            params: config.params,
            query: config.query,
        }),
        response: config.response,
    });
    const request = full.shape.request;
    const requestConfig = full.shape.request.pick({
        body: true,
        params: true,
        query: true,
    });
    const body = full.shape.request.shape.body;
    const params = full.shape.request.shape.params;
    const query = full.shape.request.shape.query;
    const method = full.shape.request.shape.method._def.value;
    const auth = full.shape.request.shape.auth._def.value;
    const needAuthentication = full.shape.request.shape.auth._def.value == "YES" ? true : false;
    const baseUrl = full.shape.request.shape.baseUrl._def.value;
    const response = full.shape.response;
    return {
        full,
        request,
        requestConfig,
        body,
        params,
        query,
        method,
        baseUrl,
        response,
        auth,
        needAuthentication,
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