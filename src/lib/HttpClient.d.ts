import { AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
/**
 * HttpClient
 */
export default class HttpClient {
    private headers;
    private baseURL;
    private instance;
    /**
     * Http instance
     */
    private get http();
    /**
     * Constructor
     * @param {AxiosRequestConfig} options options for setting the headers and baseURL
     */
    constructor({ baseURL, headers }: AxiosRequestConfig);
    /**
     * Set headers for the request
     * @param {AxiosHeaders} headers param for set header before request
     * @return {void}
     */
    setHeaders(headers: AxiosHeaders): void;
    /**
     * Inject JWT token
     * @param {AxiosRequestConfig} config The request config before to request
     * @return {InternalAxiosRequestConfig}
     */
    private onRequest;
    /**
     * Inject JWT token
     * @param {AxiosResponse} response response from call api then request
     * @return {AxiosResponse}
     */
    private onResponse;
    /**
    * Handle Error response
    * @return {void}
    */
    private onErrorResponse;
    /**
     * Initialize the http instance of axios
     * @return {AxiosInstance}
     */
    private initHttp;
    /**
     * Setup Interceptors of request and response
     * @param {AxiosInstance} http the instance for setup Intercept
     * @return {AxiosInstance}
     */
    private setupInterceptors;
    /**
     * Http Get method
     * @param {string} url path url to request
     * @param {AxiosRequestConfig} config The request config before to request get
     * @return {Promise<R>}
     */
    get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Http Post method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request post
     * @return {Promise<R>}
     */
    post<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Http Put method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request put
     * @return {Promise<R>}
     */
    put<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Http Patch method
     * @param {string} url path url to request
     * @param {T} data data for attached with request
     * @param {AxiosRequestConfig} config The request config before to request patch
     * @return {Promise<R>}
     */
    patch<T = any, R = AxiosResponse<T>>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Http Delete method
     * @param {string} url path url to request
     * @param {AxiosRequestConfig} config The request config before to request delete
     * @return {Promise<R>}
     */
    delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
}
