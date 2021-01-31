const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes=require('./routes/userRouter');
const adminRoutes=require('./routes/adminRoutes');
const managerRoutes=require('./routes/managerRoutes');
const app = express();
const dbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017";
const port = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());

app.use('/admin',adminRoutes,userRoutes,managerRoutes);
app.use('/manager',managerRoutes,userRoutes);
app.use('/user',userRoutes);

app.listen(port, console.log(`server running on port ${port}`));