import httpStatus from 'http-status';

/** api-response class */
export class ApiRes {
  constructor(
    readonly result: any = {},
    readonly status: number = httpStatus.OK,
    readonly message: string = 'success',
  ) {}

  /** returns the JSON representation of the response. */
  public toJson() {
    return {
      status: this.status,
      message: this.message,
      result: this.result,
    };
  }

  /** ok response function. */
  ok(result: any, message?: string) {
    return new ApiRes(result, httpStatus.OK, message);
  }

  /** created response function. */
  created(result: any, message?: string) {
    return new ApiRes(
      result,
      httpStatus.CREATED,
      message || 'resource created successfully',
    );
  }

  /** paginated response function. */
  paginated(data: any, meta: object, message?: string) {
    return new ApiRes({...meta, data}, httpStatus.OK, message);
  }
}
