const breezService = require('../services/breez.service');
const SATOSHIS_IN_BTC = 100_000_000;
/**
 *  Geth the health of your Express App  then check your balance
 * 
 * 
 */
const getHealth = async (req, res) => {
  try {
    const healthData = await breezService.getHealth();
    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Create a standard BOLT 11 invoice 
 * @param {amountMsat , description } req 
 * @param { invoiceData : { invoice : string, fee : number, qr : string } } res 
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
 * @param { invoiceData : { invoice : string, fee : number, qr : string } } res 
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
 * @param { onchainData : { invoice : string, fee : number, qr : string } } res 
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
  const { destination, amountMsat, currency } = req.body;
  if (!destination) {
    return res.status(400).json({ error: 'destination is required' });
  }

  if(currency) {
    // get the specified currency rate and convert the amount to sats
    const rate = await breezService.currencyRate(currency.toUpperCase());
    amountMsat = (amountMsat / rate) * SATOSHIS_IN_BTC;  
  }

  try {
    const paymentData = await breezService.pay(destination, amountMsat);
    res.status(200).json({ payment: paymentData });
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ error: error.message });
  }
};

/** Handle Bitpassa Logic
 * 
 * Scenario is : Get bunch of data from user like array of JSON objects with destination and amountMsat in specified currency { currency: "USD", invoices : [{destination: "", amountMsat: 100}] }
 * The next step is to get the total amount in the specified currency
 * Then convert the amount to sats using the currency rate
 * Generate a BOLT 11 invoice with the total amount in sats
 * User will pay the invoice ( this should be tracked with a webhook )
 * After the payment is confirmed, we will pay the invoices in the array with the specified amountMsat
 * 
 * @param {req} req 
 * @param {res} res
 * @returns {json} status and message
 * 
 * @todo Implement this feature 
 * @todo Add webhook to track payment status
 * @todo Add error handling for each step
 * @todo Add logging for each step
 * @todo Add tests for each step
 * @todo Add documentation for each step
 * @todo Add validation for each step
 * @todo Add rate limiting for each step
 * @todo Add caching for each step
 * @todo Add monitoring for each step
 * @todo Add alerting for each step
 */

const handleBitpassa = async (req, res) => {

  // verify if body is provided 

  if(!req.body | !req.body.currency || !req.body.invoices || !Array.isArray(req.body.invoices) || req.body.invoices.length === 0){
    res.status(400).json({ error: 'body is required and should contain currency and invoices array' });
    return; 
  }

  // verify if the currency is supported
  const supportedCurrencies = await breezService.currencies();
  if(!supportedCurrencies.includes(req.body.currency.toUpperCase())){
    res.status(400).json({ error: 'currency is not supported' });
    return; 
  }
  
  // get the total amount in the specified currency
  const totalAmount = req.body.invoices.reduce((total, item) => total + item.amountMsat, 0);
  // convert the amount to sats using the currency rate
  const rate = await breezService.currencyRate(req.body.currency.toUpperCase());
  const totalAmountInSats = Math.round((totalAmount / rate) * SATOSHIS_IN_BTC, 2); // rounding to 2 decimal places


  // generate a BOLT 11 invoice with the total amount in sats
  try {
    const invoiceData = await breezService.createInvoice(totalAmountInSats, `Bitpassa payment for ${req.body.currency}`);
    // return the invoice data to the user
    res.status(200).json({ invoice: invoiceData });
  } catch (error) {
    console.error('Error creating Bitpassa invoice:', error);
    res.status(500).json({ error: error.message });
  }

  // Think about the webhook to track payment status

  // Only after the payment is confirmed or is paid then we should start paying the invoices in the array with the specified amountMsat
  // This is not implemented yet, so we will just return a message that this feature is not yet implemented
  // res.status(200).json({status : "in build", message : "this feature is not yet implemented"})
  // For now, we will just return a message that this feature is not yet implemented

  res.status(200).json({status : "in build", message : "this feature is not yet implemented"})

}

/**
 * Batch payment
 * @param [{destination , amountMsat }] req 
 *  
 */


const batchPayment = async (req, res) => {

  // verify if body is provided
  if(!req.body){
    return res.status(400).json({ error: 'body is required' });
  }

  // verify if the balance can handle all payments

  const totalAmount = req.body.reduce((total, item) => total + item.amountMsat, 0);

  if(totalAmount > breezService.info.walletInfo.balanceSat){
    return res.status(400).json({ error: 'Sorry, balance is not enough to handle all payments' });
  }

  for(details of req.body) {
    try {
      const response = await payInvoice({destination : details.destination, amountMsat : details.amountMsat});
      if(response.status === 200){
         
      }
    } catch (error) {
      console.error('Error paying invoice:', error);
      res.status(500).json({ error: error.message });
    }
  }
}



/**
 * Sign a message
 * @param {message } req 
 * @param { signature : string, pubkey : string, message : string } res 
 */
const signMessage = async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        const signatureData = await breezService.signMessage(message);
        res.status(200).json({ ...signatureData });
    } catch (error) {
        console.error('Error signing message:', error);
        res.status(500).json({ error: error.message });
    }
}

const verifyMessage = async (req, res) => {
    const { signature, pubkey, message } = req.body;
    
    if(!signature ||! pubkey || !message) {
        return res.status(400).json({ error: 'signature, pubkey, and message are required' });
    }

    try {
        const signatureData = await breezService.verifySignature(signature, pubkey, message);
        res.status(200).json({ ...signatureData });
    } catch (error) {
        console.error('Error verifying message:', error);
        res.status(500).json({ error: error.message });
    }
}


const currencyRates = async (req, res) => {
  const rates = await breezService.currencies(); 

  return res.status(200).json({ rates });
}

const symbolRate = async (req , res) => {
  const { coin } = req.body;

  if(!coin){
    return res.status(400).json({ error: 'coin is required' });
  }

  try {
    const rate = await breezService.currencyRate(coin);
    res.status(200).json({ rate });
  } catch (error) {
    console.error('Error getting currency rate:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getHealth,
  createInvoice,
  createBolt12Invoice,
  receiveOnChain,
  payInvoice,
  handleBitpassa,
  signMessage,
  verifyMessage,
  currencyRates,
  symbolRate
};