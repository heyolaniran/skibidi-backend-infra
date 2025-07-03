const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const breezService = require('./services/breez.service');
const invoiceRoutes = require('./routes/invoice.routes');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Use the invoice routes for all API endpoints
app.use('/', invoiceRoutes);

const PORT = process.env.PORT || 3000;

// Initialize the Breez service and start the server
breezService.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
