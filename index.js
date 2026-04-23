const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const breezService = require('./services/breez.service');
const invoiceRoutes = require('./routes/invoice.routes');
const apiKeyGuard = require('./middleware/apiKeyGuard');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Setup Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Skibidi Breez Infra',
      version: '1.0.0',
      description: 'An Express API to build your own self-custodial infrastucture using the Breez SDK nodeless implementation.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Protect all API routes
app.use('/', apiKeyGuard, invoiceRoutes);

const PORT = process.env.PORT || 3000;

// Initialize the Breez service and start the server
breezService.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
