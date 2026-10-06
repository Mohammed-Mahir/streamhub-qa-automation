const { setWorldConstructor, World } = require('@cucumber/cucumber');
const config = require('../config/env');

class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.config = config;
    this.page = null; // set for @ui scenarios
    this.api = null; // set for @api scenarios
    this.response = null;
    this.body = null;
  }
}

setWorldConstructor(CustomWorld);
