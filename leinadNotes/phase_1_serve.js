// TEMPLATE FOR APP.JS. I HAD TO PUT THIS HEAR SO IT IS EASY FOR ME TO UNDERSTAND THE BUILDING BLOCK OF THE SERVER

// DOT ENV MODULE
const dotenv = require('dotenv');
// SETTING THE ENVIRONMENT VARIABLE from the './config.env file'
dotenv.config({ path: './config.env' });

// definining the app from './app' folder
const app = require('./app');

// ENVIRONMENT VARIABLES
console.log(app.get('env'));
// console.log(process.env);

// We can define an env variable into the environment by running the code nodemon on the command line when starting the app
// e.g
// NODE_ENV=development nodemon server.js
// NODE_ENV=development X=23 nodemon server.js (can add more than 1 variable into the environment)

// It is not adviceable to run these on the command line, when you have more than just 2 env variable, to accomplish this, we have to create a config file

// CREATING A NEW SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

// STATUS CODE
// 200 = OK
// 201 = CREATED
// 204 = NO CONTENT
// 500 = error
