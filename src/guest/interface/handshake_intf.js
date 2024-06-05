var BN = require('bn.js');
const util = require('util');
var Frame = require('./socket/udp_server.js');
const EventEmitter = require('events');

const HS = {
  REFRESH_TIMEOUT: 30000
}

class HandshakeIntf extends EventEmitter {
  constructor () {
    if (HandshakeIntf._instance) {
      throw new Error("HandshakeIntf can't be instantiated more than once")
    }

    super();
    HandshakeIntf._instance = this;

    this.start = new BN();
    this.end = new BN();
    this.frame = new Frame();

    this.counter = new BN(0, 16);
    this.counter_steps = new BN(1, 16);
    this.time = new BN(Math.floor(Date.now()/1000), 16);
    this.nounce = 0;
    this.lock_nounce = 0;
    this.buildStateEventHandler();
  }

  session = function () {
    this.counter = this.counter.add(this.counter_steps);
    this.time = new BN(Math.floor(Date.now()/1000), 16);
    console.log("new session " + "ts:" + this.time +
     " counter:" + this.counter + " Pb:" + JSON.stringify(this.Pb));

    return true;
    //await this.locknounce.session.call(null, this.Pb);
  }.bind(this);

  update = function () {
     
    this.nounce = 0;
    console.log("NOUNCE:" + JSON.stringify(this.nounce));
  }.bind(this);

  solve = function (nounce) {
     
    return 1;

  }.bind(this);

  isRefreshed = (n)=>{((n - this.start) > HS.REFRESH_TIMEOUT)? true:false };
  postEvent = (e)=>{process.nextTick(() => {this.emit('state_event', e);})};
  postEventToContract = (e, data)=>{process.nextTick(() => {this.emit('contract_event', e, data);})};
};

HandshakeIntf.prototype.sendRequest = function (nonce, validation) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.start = now;
  
  let Pb = Buffer.from(nonce, 'hex');
  console.log("Pb:" + Pb.toString());

  this.frame.sendFrame('Request', {Pb, validation});
  this.postEvent('request');
  return true;
}

HandshakeIntf.prototype.waitChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  return true;
}

HandshakeIntf.prototype.solveChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.postEventToContract("challenge", this.lock_nounce);
  //let nounce = this.lock_nounce;
  //let match = this.solve.call(null, nounce);

  //Send server challenge only if Pm matches
/*  if (match == true) {
    this.postEvent('validated');
  }
  else
    this.postEvent('idle');*/
  return true;
}

HandshakeIntf.prototype.validate = function (matched) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  if (matched)
    this.postEvent('validated');
  else
    this.postEvent('idle');
}

HandshakeIntf.prototype.createChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.postEventToContract("response");

  //this.update.call();
  //this.postEvent('send');
  return true;
}

HandshakeIntf.prototype.sendChallenge = function (nonce, secret, validation) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("HandshakeIntf FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.frame.sendFrame('Response', {nonce, secret, validation});
  this.postEvent('ack_pending');
  return true;
}

HandshakeIntf.prototype.buildStateEventHandler = function () {

  this.frame.on('challenge', function(data) {

    this.lock_nounce = data.nounce; //data.slice(0, 131);
    this.postEvent('challenge');
  }.bind(this));
}

module.exports = {
 HandshakeIntf: HandshakeIntf 
};