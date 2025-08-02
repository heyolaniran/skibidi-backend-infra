const {
  connect,
  defaultConfig,
} = require('@breeztech/breez-sdk-liquid/node');
const dotenv = require('dotenv');
const JsEventListener = require('../listeners/listen');
const QRCode = require('qrcode');
dotenv.config();

class BreezService {
  constructor() {
    this.sdk = null;
    this.info = null;
    this.currentLimits = null;
    this.listener = new JsEventListener();
  }

  async initialize() {
    try {
      const BREEZ_API_KEY = process.env.BREEZ_API_KEY;
      const BREEZ_MNEMONIC = process.env.BREEZ_MNEMONIC;

      const config = await defaultConfig('mainnet', BREEZ_API_KEY);
      console.log('Connecting to Breez...');
      this.sdk = await connect({ mnemonic: BREEZ_MNEMONIC, config });
      this.sdk.addEventListener(this.listener);
      this.info = await this.sdk.getInfo();
      console.log(`Breez SDK connected. Wallet pubkey: ${this.info.walletInfo.pubkey}`);

      this.currentLimits = await this.sdk.fetchLightningLimits();
      console.log(`Minimum amount, in sats: ${this.currentLimits.receive.minSat}`);
      console.log(`Maximum amount, in sats: ${this.currentLimits.receive.maxSat}`);
    } catch (error) {
      console.error('Failed to initialize Breez SDK:', error);
      process.exit(1);
    }
  }

  async getHealth() {
   
    this.info = await this.sdk.getInfo(); 
    return {
      status: 'ok',
      message: 'Breez SDK is connected',
      wallet: this.info.walletInfo.pubkey,
      balance: this.info.walletInfo.balanceSat,
      pendingSats: this.info.walletInfo.pendingSendSat,
      pendingReceiveSats: this.info.walletInfo.pendingReceiveSat,
    };
  }

  async createInvoice(amountMsat, description) {
    if (amountMsat < this.currentLimits.receive.minSat || amountMsat > this.currentLimits.receive.maxSat) {
      throw new Error('amountMsat is out of bounds');
    }

    const amountType = {
      type: 'bitcoin',
      payerAmountSat: amountMsat,
    };

    const prepareResponse = await this.sdk.prepareReceivePayment({
      paymentMethod: 'bolt11Invoice',
      amount: amountType,
    });

    const invoice = await this.sdk.receivePayment({
      prepareResponse,
      description: description || 'Bitcoin Dev Day',
    });

    const minReceiveFee = prepareResponse.feesSat;
    const swapperFee = prepareResponse.swapperFeerate;
    const url = await QRCode.toDataURL(invoice.destination);
    console.log(`Fee: ${minReceiveFee} sats + ${swapperFee} sats of the sent amount`);

    return { invoice: invoice.destination, fee: minReceiveFee + swapperFee, qr: url };
  }
  
  async createBolt12Invoice(description) {
    const prepareResponse = await this.sdk.prepareReceivePayment({
      paymentMethod: 'bolt12Offer'
    });
    
    const invoice = await this.sdk.receivePayment({
      prepareResponse,
      description: description || 'Bitcoin Dev Day',
    });

    const minReceiveFee = prepareResponse.feesSat;
    const swapperFee = prepareResponse.swapperFeerate;
    const url = await QRCode.toDataURL(invoice.destination);
    console.log(`Fee: ${minReceiveFee} sats + ${swapperFee} sats of the sent amount`);

    return { invoice: invoice.destination, fee: minReceiveFee + swapperFee, qr: url };
  }

  async receiveOnChain(amountMsat, description) {
     const optionalAmount = {
      type: 'bitcoin',
      payerAmountSat: amountMsat
    };

    const prepareResponse = await this.sdk.prepareReceivePayment({
      paymentMethod: 'bitcoinAddress',
      amount: optionalAmount
    });

    const receiveFeeSat = prepareResponse.feesSat;

    const receivePayment = await this.sdk.receivePayment({
      prepareResponse,
      description: description || "Bitcoin Dev Day"
    });

    const url = await QRCode.toDataURL(receivePayment.destination);
    console.log(`Fee: ${receiveFeeSat} sats`);

    return { invoice: receivePayment.destination, fee: receiveFeeSat, qr: url };
  }
  
  async pay(destination, amountMsat) {
    const parsed = await this.sdk.parse(destination);

    switch (parsed.type) {
      // pay to lightning invoice
      case 'bolt11': {
        const prepareResponse = await this.sdk.prepareSendPayment({
          destination: destination,
        });
        const sendFee = prepareResponse.feesSat;
        console.log(`Fee: ${sendFee} sats`);
        const sendResponse = await this.sdk.sendPayment({
          prepareResponse,
        });
        return sendResponse.payment;
      }

      // pay to bolt12 offer
      case 'bolt12': {
        if (!amountMsat) {
          throw new Error('amountMsat is required for Bolt 12 offers');
        }
        const optionalAmount = {
          type: 'bitcoin',
          payerAmountSat: amountMsat,
        };
        const prepareResponseBolt12 = await this.sdk.prepareSendPayment({
          destination: destination,
          amount: optionalAmount,
        });
        const sendBolt12Response = await this.sdk.sendPayment({
          prepareResponse: prepareResponseBolt12,
        });
        return sendBolt12Response.payment;
      }

      // pay to onchain address
      case 'bitcoinAddress': {
        const prepareOnChainResponse = await this.sdk.preparePayOnChain({
          amount: {
            type: 'bitcoin',
            receiverAmountSat: amountMsat,
          },
        });
        const totalFeeSat = prepareOnChainResponse.feesSat;
        console.log(`Fee: ${totalFeeSat} sats for this onchain payment`);
        const paymentOnChain = await this.sdk.payOnchain({
          address: destination,
          prepareResponse: prepareOnChainResponse,
        });
        console.log(`Payment: ${paymentOnChain}`);
        return paymentOnChain;
      }

      // pay to lightning url
      case 'lnUrlPay': {

        const amount = {
          type: 'bitcoin',
          receiverAmountSat: amountMsat
        }

        const optionalComment = 'from skibidi-breez'
        const opttionalValidateSuccessActionUrl = true

        const prepareLnUrlPayResponse = await this.sdk.prepareLnurlPay({
          data: parsed.data,
          amount: amountMsat,
          bip353Address: parsed.bip353Address,
          comment: optionalComment,
          validateSuccessActionUrl: opttionalValidateSuccessActionUrl
        })

        const feesSat = prepareLnUrlPayResponse.feesSat;
        
        console.log(`Fee: ${feesSat} sats`);

        // sending the prepared payment
        const LnPayment = await this.sdk.lnurlPay({
          prepareResponse : prepareLnUrlPayResponse,
        })

        console.log(`Payment: ${LnPayment}`); 

        return LnPayment;
      }

      default:
        throw new Error('Invalid invoice type');
    }
  }

  // Sign message 

  async signMessage(message) {
    const signResponse = await this.sdk.signMessage({message});

    const info = await this.sdk.getInfo(); 

    return {
        signature: signResponse.signature,
        pubkey: info.walletInfo.pubkey,
        message: message,
    }
    
  }

  // Verify signature

  async verifySignature(signature,pubkey, message) {
    const verifyResponse = await this.sdk.checkMessage({
        message: message, 
        pubkey: pubkey,
        signature: signature
    }); 

    const isValid = verifyResponse.isValid

    return {
        status: isValid
    }
  }

  /**
 * Get list of fiat swap supported
 */

  async currencies() {
    const rates = await this.sdk.fetchFiatRates(); 

    return rates; 
  }


  /**
   * Get rate for one specific currency 
   * 
   * @param {currency : string} 
   * @returns {value : number}
   * 
   */

  async currencyRate(coin) {
    
    const rates = await this.sdk.fetchFiatRates(); 

    let value = (rates.find(rate => rate.coin === coin)).value;

    if(!value) {
      throw new Error('The currency is not supported');
    }

    value = Math.round(value, 2);

    return value;
    
  }

}

module.exports = new BreezService();