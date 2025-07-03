const {
  connect,
  defaultConfig,
} = require('@breeztech/breez-sdk-liquid/node');
const dotenv = require('dotenv');
const JsEventListener = require('../listeners/listen');

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

  getHealth() {
    if (!this.info) {
        throw new Error('Breez SDK not initialized');
    }
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
    console.log(`Fee: ${minReceiveFee} sats + ${swapperFee} sats of the sent amount`);

    return { invoice: invoice.destination, fee: minReceiveFee + swapperFee };
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
    console.log(`Fee: ${minReceiveFee} sats + ${swapperFee} sats of the sent amount`);

    return { invoice: invoice.destination, fee: minReceiveFee + swapperFee };
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

    return { invoice: receivePayment.destination, fee: receiveFeeSat };
  }
  
  async pay(destination, amountMsat) {
    const parsed = await this.sdk.parse(destination);

    switch (parsed.type) {
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
      default:
        throw new Error('Invalid invoice type');
    }
  }
}

module.exports = new BreezService();