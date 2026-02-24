require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./database/connection');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
