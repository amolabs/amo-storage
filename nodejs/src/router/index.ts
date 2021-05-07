import express from 'express';
import parcelsRouter from './parcels-router'
import authRouter from './auth-router'

const router = express.Router();

const baseUrl = '/api/v1'

router.get('/', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'AMO Storage API',
    }));
});

router.use(`${baseUrl}/parcels`, parcelsRouter)
router.use(`${baseUrl}/auth`, authRouter)

export default router