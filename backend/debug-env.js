require('dotenv').config();
console.log('--- Env Keys ---');
Object.keys(process.env).forEach(key => {
    if (key.includes('EMAIL') || key.includes('PASS') || key.includes('USER') || key.includes('ADMIN')) {
        console.log(key);
    }
});
console.log('----------------');
