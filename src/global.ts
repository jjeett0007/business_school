import catchAsync from "./utils/catchAsync";
import getId from "./utils/getId";
import handleResponse from "./utils/handleResponse";
import statusCodeMap from "./utils/statusCode";
import formatResponse from "./utils/responseFormatter";
import httpStatus from "http-status";

// Assign to global
global.catchAsync = catchAsync;
global.getId = getId;
global.handleResponse = handleResponse;
global.statusCodeMap = statusCodeMap;
global.formatResponse = formatResponse;
global.httpStatus = httpStatus;
