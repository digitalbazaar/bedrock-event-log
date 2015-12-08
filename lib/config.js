/*
 * Bedrock event log configuration.
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('bedrock').config;
var path = require('path');

config['event-log'] = {};
config['event-log'].eventTypes = {};
config['event-log'].log = {
  name: 'eventLog'
};

// load validation schemas
config.validation.schema.paths.push(path.join(__dirname, '..', 'schemas'));
