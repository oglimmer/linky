'use strict';

const appLogger = require('winston').loggers.get('application');
const _ = require('lodash');
const linkDao = require('../dao/linkDao');
const ResponseUtil = require('../util/ResponseUtil');
const BaseProcessor = require('./BaseProcessor');


class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkUrl } = this.req.body;
    this.data = { type: "link" , linkUrl };
  }

  propertiesToValidate() {
    return [ "linkUrl" ];
  }

  *process() {
    try {
      const { id } = yield linkDao.insert(this.data);
      this.res.send( { id } );
      appLogger.debug("Create link id=%s to db: %j", id, this.data);
    } catch(err) {
      appLogger.error(err);
      ResponseUtil.sendErrorResponse(err, this.res);
    }
    this.next();
  }

}

class GetLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  *process() {
    try {
      const rows = yield linkDao.listByUserid(this.data.userid);
      const responseArr = _.map(rows, (row) => {
      	return { id: row.value._id, linkUrl: row.value.linkUrl };
      });
      this.res.send(responseArr);
      appLogger.debug("Get all links from db for user %s resulted in %d rows", this.data.userid, responseArr.length);
    } catch(err) {
      appLogger.error(err);
      ResponseUtil.sendErrorResponse(err, this.res);
    }
    this.next();
  }

}

class DeleteProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  propertiesToValidate() {
    return [ "linkid" ];
  }

  *process() {
    try {
      yield linkDao.deleteLatest(this.data.linkid);
      this.res.send();
      appLogger.debug("Deleted link with id=%s", this.data.linkid);
    } catch(err) {
      appLogger.error(err);
      ResponseUtil.sendErrorResponse(err, this.res);
    }
    this.next();
  }

}

module.exports = {

  createLink: function(req, res, next) {
    const crp = new CreateLinkProcessor(req, res, next);
    crp.doProcess();
  },

  getLinkCollection: function(req, res, next) {
    const glp = new GetLinkProcessor(req, res, next);
    glp.doProcess();
  },

  deleteLink: function(req, res, next) {
  	const dp = new DeleteProcessor(req, res, next);
    dp.doProcess();
  }

}
