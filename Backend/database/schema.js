const { userSchema, User } = require('./schemas/userSchema');
const { problemSchema, Problem } = require('./schemas/problemSchema');
const { solutionSchema, Solution } = require('./schemas/solutionSchema');
const { collaborationSchema, Collaboration } = require('./schemas/collaborationSchema');

module.exports = {
  // Schemas
  userSchema,
  problemSchema,
  solutionSchema,
  collaborationSchema,

  // Models
  User,
  Problem,
  Solution,
  Collaboration,
};
