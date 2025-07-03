const express = require('express');
const router = express.Router();
const {
  getHealth,
  createInvoice,
  createBolt12Invoice,
  receiveOnChain,
  payInvoice,
} = require('../controllers/invoice.controller');


router.get('/health', getHealth);
router.post('/create-invoice', createInvoice);
router.post('/bolt12/create-invoice', createBolt12Invoice);
router.post('/receive-onchain', receiveOnChain);
router.post('/pay-invoice', payInvoice);

module.exports = router;