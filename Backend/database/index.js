const connectDB = require('./db');
const {
  userSchema,
  problemSchema,
  solutionSchema,
  collaborationSchema,
  User,
  Problem,
  Solution,
  Collaboration,
} = require('./schema');

module.exports = {
  // Database connection
  connectDB,

  // Models
  User,
  Problem,
  Solution,
  Collaboration,

  // Schemas
  userSchema,
  problemSchema,
  solutionSchema,
  collaborationSchema,
};
