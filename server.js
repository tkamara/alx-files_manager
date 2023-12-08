import express from 'express';
import controlRouting from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT);

// app.use(express.json());
app.use(express.json({ limit: '10mb' }));

controlRouting(app);
