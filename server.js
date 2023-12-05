import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT);

app.use('/', routes);
