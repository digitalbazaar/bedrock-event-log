/*
 * Bedrock event log module.
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
 /* jshint node: true */
'use strict';
var async = require('async');
var bedrock = require('bedrock');
var database = require('bedrock-mongodb');
var validate = require('bedrock-validation').validate;

// load config defaults
require('./config');
var eventLogConfig = bedrock.config['event-log'];
var eventTypes = bedrock.config['event-log'].eventTypes;

var logger = bedrock.loggers.get('app');

// distributed ID generator for credentials
var eventIdGenerator = null;

// module API
var api = {};
module.exports = api;

api.EventLog = EventLog;
api.log = new EventLog();

bedrock.events.on('bedrock-mongodb.ready', function(callback) {
  api.log._init(eventLogConfig.log, callback);
});

function EventLog() {
  this.name = null;
  this.collection = null;
}

EventLog.prototype._init = function(options, callback) {
  var self = this;
  self.name = options.name;
  logger.debug('bedrock-event-log creating log: ' + self.name);
  async.auto({
    openCollections: function(callback) {
      database.openCollections([self.name], function(err) {
        if(!err) {
          self.collection = database.collections[self.name];
        }
        callback(err);
      });
    },
    createIndexes: ['openCollections', function(callback) {
      database.createIndexes([{
        collection: self.name,
        fields: {'event.id': 1},
        options: {unique: true, background: false}
      }, {
        collection: self.name,
        fields: {'event.resource': 1, 'event.date': 1},
        options: {sparse: true, background: false}
      }, {
        collection: self.name,
        fields: {'event.resource': 1, 'event.actor': 1, 'event.date': 1},
        options: {sparse: true, background: false}
      }, {
        collection: self.name,
        fields: {'event.actor': 1, 'event.date': 1},
        options: {sparse: true, background: false}
      }, {
        collection: self.name,
        fields: {'event.type': 1, 'typeSpecific': 1, 'event.date': 1},
        options: {sparse: true, background: false}
      }], callback);
    }],
    createIdGenerator: function(callback) {
      database.getDistributedIdGenerator('event-log',
        function(err, idGenerator) {
          if(!err) {
            eventIdGenerator = idGenerator;
          }
          callback(err);
        });
    }
  }, function(err) {
    if(!err) {
      logger.debug('bedrock-event-log created log: ' + self.name);
    }
    callback(err);
  });
};

EventLog.prototype.add = function(event, callback) {
  var self = this;
  var typeIndex = null;
  if(!(event.type in eventLogConfig.eventTypes)) {
    throw new Error('Event type is undefined: ' + event.type);
  }
  if('index' in eventLogConfig.eventTypes[event.type]) {
    if(!(eventLogConfig.eventTypes[event.type].index in event)) {
      throw new Error(
        'Event does not contain the required index field: ' +
        eventLogConfig.eventTypes[event.type].index);
    }
    typeIndex = eventLogConfig.eventTypes[event.type].index;
  }
  if(eventLogConfig.eventTypes[event.type].ensureWriteSuccess === undefined) {
    eventLogConfig.eventTypes[event.type].ensureWriteSuccess = true;
  }
  var validation = validate('event.event-log', event);
  if(!validation.valid) {
    var validationError = validation.error;
    validationError.errors = validation.errors;
    // FIXME: should this throw instead?
    logger.error('bedrock-event-log', validationError);
    return callback(validationError);
  }
  // if ensureWriteSuccess is false, callback immediately, set callback to noop
  // and proceed
  if(!eventLogConfig.eventTypes[event.type].ensureWriteSuccess) {
    callback();
    callback = noop;
  }
  async.auto({
    generateId: function(callback) {
      eventIdGenerator.generateId(callback);
    },
    addEvent: ['generateId', function(callback, results) {
      event.id = results.generateId;
      var record = {
        event: event
      };
      if(typeIndex) {
        record.typeSpecific = database.hash(event[typeIndex]);
      }
      self.collection.insert(
        record, database.writeOptions, function(err, result) {
          if(err) {
            return callback(err);
          }
          callback(null, result.ops[0]);
        });
    }]
  }, function(err, results) {
    if(err) {
      logger.error('bedrock-event-log', err);
    }
    callback(err, results.addEvent);
  });
};

EventLog.prototype.find = function(query, callback) {
  var self = this;
  self.collection.find(query).toArray(callback);
};

function noop() {}
