import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pawber API',
            version: '4.0.0',
            description: 'API documentation for the Pawber Marketplace platform. Includes services, bookings, providers, and more.',
            contact: {
                name: 'Pawber Support',
                url: 'https://pawber.onrender.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server'
            },
            {
                url: 'https://pawber.onrender.com',
                description: 'Production server on Render'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./src/routes/*.ts', './src/modules/**/*.routes.ts', './src/modules/**/*.schema.ts'],
};

const swaggerSpec = swaggerJsDoc(options);

export function setupSwagger(app: Express) {
    // Swagger UI route
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Also expose the raw JSON spec if needed
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('✅ Swagger documentation available at /api-docs');
}
