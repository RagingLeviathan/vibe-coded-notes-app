import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import os from 'os';
import { setRoutes } from './routes/notes';
import dbRouter from './routes/db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

setRoutes(app);
// mount DB debug routes under /api/db
app.use('/api/db', dbRouter);

app.listen(PORT, () => {
    // Print localhost and detected LAN IPv4 addresses so you can connect from
    // other devices on the same network.
    console.log(`Server is running on http://localhost:${PORT}`);

    const nets = os.networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(nets)) {
        const net = nets[name];
        if (!net) continue;
        for (const iface of net) {
            // On Node >= 18, family is a string like 'IPv4'
            const family = (iface as any).family || '';
            if ((family === 'IPv4' || family === 4) && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }

    if (addresses.length) {
        addresses.forEach((addr) => {
            console.log(`Server is also available on your LAN at http://${addr}:${PORT}`);
        });
    } else {
        console.log('No LAN IPv4 addresses detected. If you need LAN access, ensure your machine is connected to the network.');
    }
});