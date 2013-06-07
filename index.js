module.exports = process.env.LIB_COV
   ? require('./cov/lib/mongo')
   : require('./lib/mongo');