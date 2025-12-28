import express from 'express';
import authRoutes from './routes/auth.routes';
import itineraryRoutes from './routes/itinerary.routes';
import adminRoutes from './routes/admin.routes';
import sharedRoutes from "./routes/shared.routes";
import shareRoutes from "./routes/share.routes";

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api", shareRoutes);
app.use("/api/shared", sharedRoutes);


app.listen(3000, () => {
  console.log('Server running on port 3000');
});
