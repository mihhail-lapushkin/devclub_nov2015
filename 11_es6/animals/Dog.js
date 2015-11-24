'use strict'

var Animal = require('./Animal')

module.exports = class Dog extends Animal {
  speak() {
    super.speak()

    console.log(this.name + ' barks.')
  }
}