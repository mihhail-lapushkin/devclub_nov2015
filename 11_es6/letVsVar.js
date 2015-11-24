'use strict'

for (let i = 0; i < 10; i++) {}

if (typeof i !== 'undefined') {
  console.log(`i is ${i}`)
}

for (var j = 0; j < 10; j++) {}

if (typeof j !== 'undefined') {
  console.log(`j is ${j}`)
}