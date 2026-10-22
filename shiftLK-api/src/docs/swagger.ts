export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ShiftLK Spares REST API',
    version: '1.0.0',
    description:
      'High-performance, standalone backend REST API for ShiftLK Motorcycle Spares E-Commerce platform (Sri Lanka).',
    contact: {
      name: 'ShiftLK Engineering',
      email: 'support@shiftlk.lk',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          200: { description: 'Service is operational' },
        },
      },
    },
    '/api/v1/products': {
      get: {
        summary: 'List Public Products',
        tags: ['Public Products'],
        parameters: [
          { name: 'query', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'Paginated list of products without cost_price' },
        },
      },
    },
    '/api/v1/delivery-zones': {
      get: {
        summary: 'List Sri Lankan Delivery Districts',
        tags: ['Public Delivery'],
        responses: {
          200: { description: 'List of 25 active delivery districts' },
        },
      },
    },
    '/api/v1/orders': {
      post: {
        summary: 'Place WhatsApp Order',
        tags: ['Public Orders'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'phone', 'address', 'district', 'items'],
                properties: {
                  customerName: { type: 'string' },
                  phone: { type: 'string', example: '077 123 4567' },
                  address: { type: 'string' },
                  district: { type: 'string', example: 'Colombo' },
                  locale: { type: 'string', enum: ['en', 'si', 'ta'] },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        qty: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order created with WhatsApp link' },
        },
      },
    },
    '/api/v1/admin/auth/login': {
      post: {
        summary: 'Admin Login',
        tags: ['Admin Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns tokens and sets httpOnly cookies' },
        },
      },
    },
    '/api/v1/admin/analytics/overview': {
      get: {
        summary: 'Financial & Inventory Overview',
        tags: ['Admin Analytics'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Revenue, COGS, Gross Profit, Expenses, and Net Profit' },
        },
      },
    },
  },
};
