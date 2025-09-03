import type catchAsyncType from "utils/catchAsync";
import type getIdType from "utils/getId";
import type handleResponseType from "utils/handleResponse";
import type statusCodeMapType from "utils/statusCode";
import type formatResponseType from "utils/responseFormatter";
import type * as httpStatusType from "http-status";

declare global {
  // eslint-disable-next-line no-var
  var catchAsync: typeof catchAsyncType;
  var getId: typeof getIdType;
  var handleResponse: typeof handleResponseType;
  var statusCodeMap: typeof statusCodeMapType;
  var formatResponse: typeof formatResponseType;
  var httpStatus: typeof httpStatusType;
}

export {};
