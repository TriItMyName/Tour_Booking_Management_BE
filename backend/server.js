const express = require('express');

const cors = require('cors');
const usersRoutes = require('./routers/usersRouters');
const rolesRoutes = require('./routers/rolesRouters');
const bookingsRoutes = require('./routers/bookingsRouters');
const tourAssignmentsRoutes = require('./routers/tourAssignmentsRouters');
const regionsRoutes = require('./routers/regionsRouters');
const loginHistoryRoutes = require('./routers/loginHistoryRouters');
const notificationsRoutes = require('./routers/notificationsRouters');
const toursRoutes = require('./routers/toursRouters');
const tourTimelineRoutes = require('./routers/tourTimelineRouters');
const toursImageRoutes = require('./routers/toursImageRouters');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = '12345678'; 

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use('/api', usersRoutes);
app.use('/api', rolesRoutes);
app.use('/api', bookingsRoutes);
app.use('/api', tourAssignmentsRoutes);
app.use('/api', regionsRoutes);
app.use('/api', loginHistoryRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', toursRoutes);
app.use('/api', tourTimelineRoutes);
app.use('/api', toursImageRoutes);


// Chạy server
app.listen(port, () => {
    console.log(`Server chạy tại http://localhost:${port}`);
});
