import httpStatus from 'http-status';

/** api response class */
export class ApiRes {
  declare result: any;
  declare message: string;
  declare status: number;

  /**
   * Creates an HTTP JSON response.
   * @param result - The data to be sent in the response.
   * @param status - The HTTP status code (default: 200 OK).
   * @param message - The message associated with the response (default: "Success").
   */
  constructor(
    result: any = {},
    status: number = httpStatus.OK,
    message: string = 'success',
  ) {
    this.status = status;
    this.message = message;
    this.result = result;
  }

  /** ok response function. */
  static ok(result: any, message?: string) {
    return new ApiRes(result, httpStatus.OK, message || 'success');
  }

  /** created response function. */
  static created(result: any, message?: string) {
    return new ApiRes(
      result,
      httpStatus.CREATED,
      message || 'resource created successfully',
    );
  }
}
