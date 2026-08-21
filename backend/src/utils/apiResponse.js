'use strict';

class ApiResponse {
  static send(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
    const body = { success: statusCode < 400, message };
    if (data !== null && data !== undefined) body.data = data;
    if (meta !== null && meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, data, message = 'Success', meta = null) {
    return ApiResponse.send(res, { statusCode: 200, message, data, meta });
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.send(res, { statusCode: 201, message, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
