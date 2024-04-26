"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const CustomError_1 = require("./errors/CustomError");
/**
 * HttpClient
 */
class HttpClient {
    /**
     * Http instance
     */
    get http() {
        return this.instance !== null ? this.instance : this.initHttp();
    }
    /**
     * Constructor
     * @param {AxiosRequestConfig} options options for setting the headers and baseURL
     */
    constructor({ baseURL, headers }) {
        this.instance = null;
        this.baseURL = String(baseURL);
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            ...headers,
        };
    }
    /**
     * Set headers for the request
     * @param {AxiosHeaders} headers param for set header before request
     * @return {void}
     */
    setHeaders(headers) {
        this.headers = headers;
    }
    /**
     * Inject JWT token
     * @param {AxiosRequestConfig} config The request config before to request
     * @return {InternalAxiosRequestConfig}
     */
    onRequest(config) {
        try {
            if (this.headers.Authorization) {
                config.headers.Authorization = this.headers.Authorization;
            }
            return config;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    /**
     * Inject JWT token
     * @param {AxiosResponse} response response from call api then request
     * @return {AxiosResponse}
     */
    onResponse(response) {
        const data = response.data;
        const { status, result } = data;
        if (status === 'ERROR') {
            throw CustomError_1.default.fromJSON(result);
        }
        return result;
    }
    /**
    * Handle Error response
    * @return {void}
    */
    onErrorResponse() {
        throw new Error('The requested API returned an unknown error. Please contact developer for more info.');
    }
    /**
     * Initialize the http instance of axios
     * @return {AxiosInstance}
     */
    initHttp() {
        const http = axios_1.default.create({ baseURL: this.baseURL, headers: this.headers });
        this.instance = this.setupInterceptors(http);
        return http;
    }
    /**
     * Setup Interceptors of request and response
     * @param {AxiosInstance} http the instance for setup Intercept
     * @return {AxiosInstance}
     */
    setupInterceptors(http) {
        http.interceptors.request.use(this.onRequest.bind(this), this.onErrorResponse);
        http.interceptors.response.use(this.onResponse, this.onErrorResponse);
        return http;
    }
    /**
     * Http Get method
     * @param {string} url path url to request
     * @param {AxiosRequestConfig} config The request config before to request get
     * @return {Promise<R>}
     */
    get(url, config) {
        return this.http.get(url, config);
    }
    /**
     * Http Post method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request post
     * @return {Promise<R>}
     */
    post(url, data, config) {
        return this.http.post(url, data, config);
    }
    /**
     * Http Put method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request put
     * @return {Promise<R>}
     */
    put(url, data, config) {
        return this.http.put(url, data, config);
    }
    /**
     * Http Patch method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request patch
     * @return {Promise<R>}
     */
    patch(url, data, config) {
        return this.http.patch(url, data, config);
    }
    /**
     * Http Delete method
     * @param {string} url path url to request
     * @param {AxiosRequestConfig} config The request config before to request delete
     * @return {Promise<R>}
     */
    delete(url, config) {
        return this.http.delete(url, config);
    }
}
exports.default = HttpClient;
//# sourceMappingURL=HttpClient.js.map