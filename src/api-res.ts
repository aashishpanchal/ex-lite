import httpStatus from 'http-status';

/**
 * ApiRes class for standardizing API responses
 */
export class ApiRes {
  /**
   * Creates an instance of ApiRes.
   * @param {any} result - The result of the operation
   * @param {number} status - The HTTP status code
   * @param {string} message - The response message
   */
  constructor(
    readonly result: any = {},
    readonly status: number = httpStatus.OK,
    readonly message: string = 'Operation successful',
  ) {}

  /**
   * Returns the JSON representation of the response.
   * @returns The JSON representation of the response
   */
  public toJson() {
    return {
      status: this.status,
      message: this.message,
      result: this.result,
    };
  }

  /**
   * Creates an OK (200) response.
   * @param {any} result - The result to be included in the response
   * @param {string} [message='Request processed successfully'] - The response message
   * @returns {ApiRes} An ApiRes instance with OK status
   */
  static ok(
    result: any,
    message: string = 'Request processed successfully',
  ): ApiRes {
    return new ApiRes(result, httpStatus.OK, message);
  }

  /**
   * Creates a Created (201) response.
   * @param {any} result - The result to be included in the response
   * @param {string} [message='Resource created successfully'] - The response message
   * @returns {ApiRes} An ApiRes instance with Created status
   */
  static created(
    result: any,
    message: string = 'Resource created successfully',
  ): ApiRes {
    return new ApiRes(result, httpStatus.CREATED, message);
  }

  /**
   * Creates a paginated OK (200) response.
   * @param {any} data - The paginated data
   * @param {object} meta - Metadata for pagination
   * @param {string} [message='Data retrieved successfully'] - The response message
   * @returns {ApiRes} An ApiRes instance with OK status and paginated data
   */
  static paginated(
    data: any,
    meta: object,
    message: string = 'Data retrieved successfully',
  ): ApiRes {
    return new ApiRes({...meta, data}, httpStatus.OK, message);
  }
}
