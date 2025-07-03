const breezService = require('../services/breez.service');

/**
 *  Geth the health of your Express App  then check your balance
 * 
 * 
 */
const getHealth = (req, res) => {
  try {
    const healthData = breezService.getHealth();
    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Create a standard BOLT 11 invoice 
 * @param {amountMsat , description } req 
 * @param { invoiceData : { invoice : string, fee : number } } res 
 */
const createInvoice = async (req, res) => {
  const { amountMsat, description } = req.body;
  if (!amountMsat) {
    return res.status(400).json({ error: 'amountMsat is required' });
  }

  try {
    const invoiceData = await breezService.createInvoice(amountMsat, description);
    res.status(201).json(invoiceData);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * Create a BOLT 12 invoice 
 * @param {description } req 
 * @param { invoiceData : { invoice : string, fee : number } } res 
 */
const createBolt12Invoice = async (req, res) => {
  const { description } = req.body;

  try {
    const invoiceData = await breezService.createBolt12Invoice(description);
    res.status(201).json(invoiceData);
  } catch (error) {
    console.error('Error creating BOLT 12 invoice:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * Get a Bitcoin address for on-chain payments
 * @param {amountMsat , description } req 
 * @param { onchainData : { invoice : string, fee : number } } res 
 */
const receiveOnChain = async (req, res) => {
  const { amountMsat, description } = req.body;
  if (!amountMsat) {
    return res.status(400).json({ error: 'amountMsat is required' });
  }

  try {
    const onchainData = await breezService.receiveOnChain(amountMsat, description);
    res.status(201).json(onchainData);
  } catch (error) {
    console.error('Error receiving on-chain:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * Pay any BOLT 11, BOLT 12, or Bitcoin address
 * @param {destination , amountMsat } req 
 * @param { paymentData : { payment : string } } res 
 */
const payInvoice = async (req, res) => {
  const { destination, amountMsat } = req.body;
  if (!destination) {
    return res.status(400).json({ error: 'destination is required' });
  }

  try {
    const paymentData = await breezService.pay(destination, amountMsat);
    res.status(200).json({ payment: paymentData });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getHealth,
  createInvoice,
  createBolt12Invoice,
  receiveOnChain,
  payInvoice,
};