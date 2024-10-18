// src/swagger.ts

import { Options } from 'swagger-jsdoc';
import dotenv from 'dotenv';

const port = process.env.PORT || 3000;
const URL = process.env.PORT || "NO URL"

const swaggerOptions: Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'API Documentation',
      version: '2.0.0',
      description: 'API documentation for Swapi test',
    },
    servers: [
      {
        url: `${URL}`, // Replace with your server URL
      },
    ],
  },
  apis: ['./src/**/*.ts'], // Path to your TypeScript files
};

export default swaggerOptions;
