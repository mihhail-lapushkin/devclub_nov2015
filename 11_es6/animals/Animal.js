'use strict'

module.exports = class Animal { 
  constructor(name) {
    this.name = name
  }
  
  speak() {
    console.log(this.name + ' makes a noise.')
  }
}