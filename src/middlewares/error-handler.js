import httpStatus from 'http-status';
import UnauthorizedError from '../utilities/errors/unauthorized.js';
import Constants from '../utilities/constants.js';

export default function ErrorHandler(err, req, res) {
  let statusCode = httpStatus.BAD_REQUEST;
  let response = { error: err && err.code ? err.code : null };
  if (err.errors && err.errors.length > 0) {
    statusCode = httpStatus.BAD_REQUEST;
    response = { error: err.errors.pop().msg };
  } else if (err instanceof UnauthorizedError) {
    statusCode = httpStatus.UNAUTHORIZED;
  } else {
    if (!Constants.isProduction) {
      console.log(err);
    }
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    response = err;
  }
  res.status(statusCode);
  res.json(response);
}

export function ThrowErrors(req) {
  if (req.errorList && req.errorList.length > 0) {
    throw req.errorList;
  }
}
