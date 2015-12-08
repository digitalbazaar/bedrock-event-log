/*
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = require('bedrock');
var validation = require('bedrock-validation');
var schemas = validation.schemas;

var schema = {
  type: 'object',
  title: 'Event',
  properties: {
    date: schemas.w3cDateTime({required: true}),
    type: {type: 'string', required: true},
    resource: {type: 'array', required: false},
    actor: {type: 'string', required: false}
  }
};

module.exports = function() {
  return schema;
};
