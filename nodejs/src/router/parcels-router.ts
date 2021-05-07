import express from 'express';

const router = express.Router();

router.post('/', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Post parcel',
    }));
});

router.get('/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Get Specific parcel',
    }));
});

router.get('/download/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Download Specific File by parcel id',
    }));
});

router.delete('/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Delete Specific parcel by parcel id',
    }));
});

export default router;