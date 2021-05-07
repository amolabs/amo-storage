import express from 'express';

const router = express.Router();

router.post('/', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Post auth',
    }));
});

export default router;