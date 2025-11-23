require('dotenv').config();
console.log('--- All Env Keys ---');
Object.keys(process.env).forEach(key => console.log(key));
console.log('--------------------');
