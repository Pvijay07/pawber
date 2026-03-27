import { createApp } from './src/app';

const app = createApp();
const expressListRoutes = require('express-list-endpoints');
console.log(expressListRoutes(app));
