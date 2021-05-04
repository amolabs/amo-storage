import express from 'express';
import hello from './models/hello';

const router = express.Router();

router.get('/', (req, res) => {
  const helloMessage = hello.getHelloMessage();
  res.status(200).send(helloMessage);
});

export default router;
