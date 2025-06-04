// USING EXPRESS FRAMEMWORK

// Defining the core modules
const fs = require('fs');

// Defining 3rd party modules/middlware
// Defining express framework into a variable
const express = require('express');
// Defining the morgan module
const morgan = require('morgan');

// Defining the app variable for us to be able to use express
const app = express();

// MIDDLEWAREES
app.use(morgan('dev'));
app.use(express.json());

// CREATING OUR OWN MIDDLEWARE
app.use((req, res, next) => {
  console.log('Hello Motherfuckers, I am the middleware boogieware');
  next();
  // When making our own middleware, we have to call in the next function parameter otherwise the program will stop running and once a response is sent back, that is if a middleware is between a route, it and that route is called upon, the middleware will not get run because a response has ended the program
});

// USING MIDDLEWARE TO SPOT THE TIME THE REQUES HAPPENED
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// SERVER
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// CALLBACK FUNCTIONS
const getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    result: tours.length,
    data: {
      tours: tours,
    },
  });
  //   res.send('Hello World!');
};

const createTour = (req, res) => {
  //   console.log(req.body);
  const newId = tours[tours.length - 1].id + 1; //Getting the id of the last tour and adding it up with 1 to create the new id of the one just added
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'succes',
        data: {
          tour: newTour,
        },
      });
    }
  );
  //   res.send('Done');
};

const getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  //   if (id > tours.length)
  if (!tour) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid ID',
    });
  }

  console.log(tour);

  res.status(200).json({
    statuss: 'success',
    data: {
      tour,
    },
  });
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: {
      tour: null,
    },
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

// GETTING ALL TOURS ROUTING
app.get('/api/v1/tours', getAllTours);

// POSTING A NEW TOUR TO THE TOUR DATABASE
app.post('/api/v1/tours', createTour);

//RESPONDING TO URL PARAMETERS
app.get(`/api/v1/tours/:id`, getTour);

// USING PATCH TO UPDATE THE A PROPERTY IN A TOUR
app.patch('/api/v1/tours/:id', updateTour);

// USING DELETE TO DELETE
app.delete('/api/v1/tours/:id', deleteTour);

// OR BETTER STILL DO
app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.route('/api/v1/users').get(getAllUsers).post(createUsers);

app
  .route('/api/v1/users/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

// CREATING A NEW SERVER
const port = 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

// STATUS CODE
// 200 = OK
// 201 = CREATED
// 204 = NO CONTENT
// 500 = error
