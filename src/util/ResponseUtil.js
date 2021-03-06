
function isObject(value) {
  const type = typeof value;
  return !!value && (type === 'object' || type === 'function');
}

class ResponseUtil {
  static sendErrorResponse500(err, res) {
    ResponseUtil.sendErrorResponse(500, err, res);
  }

  static sendErrorResponse(code, err, res) {
    let responseOutput;
    if (isObject(err)) {
      const { message, reason } = err;
      responseOutput = { message, reason };
    } else {
      responseOutput = { message: err, reason: err };
    }
    res.status(code).send(responseOutput);
    // appLogger.debug('Response %d with %j', code, responseOutput);
  }

  static sendErrorResponseNotEmpty500(name, res) {
    ResponseUtil.sendErrorResponseNotEmpty(500, name, res);
  }

  static sendErrorResponseNotEmpty(code, name, res) {
    const text = `${name} must not be empty`;
    ResponseUtil.sendErrorResponse(code, text, res);
  }
}

export default ResponseUtil;
