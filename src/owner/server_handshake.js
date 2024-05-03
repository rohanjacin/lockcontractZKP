var BN = require('bn.js');
const util = require('util');
const EventEmitter = require('events');
var ServerNounce = require('./server_nounce.js');

const HS = {
  REFRESH_TIMEOUT: 30000
}

class ServerHandshake extends EventEmitter {
  constructor () {
    if (ServerHandshake._instance) {
      throw new Error("ServerHandshake can't be instantiated more than once")
    }

    super();
    ServerHandshake._instance = this;

    this.start = new BN();
    this.end = new BN();
    //this.frame = new Frame();

    this.counter = new BN(0, 16);
    this.counter_steps = new BN(1, 16);
    this.time = new BN(Math.floor(Date.now()/1000), 16);
    this.servernounce = new ServerNounce(this.time, this.counter);
    this.nounce = this.servernounce.nounce;
    this.lock_nounce = 0;
  }

  session = function () {

    this.counter = this.counter.add(this.counter_steps);
    this.time = new BN(Math.floor(Date.now()/1000), 16);
    console.log("new session " + "ts:" + this.time +
     " counter:" + this.counter /*+ " nounce:" + JSON.stringify(servernounce.nounce)*/);
    return this.servernounce.session.call(null, this.time);

  }.bind(this);

  update = function () {

    //console.log("Handshake Session Update");
    this.servernounce.update.call(null, this.time, this.counter);
    this.nounce = this.servernounce.nounce;

    console.log("\nSERVER NONCE:" + JSON.stringify(this.nounce));
    //console.log("\nLENGTH:" + this.nounce.length);

  }.bind(this);

  solve = function (nounce) {
     
    console.log("In solve(hs):" + JSON.stringify(nounce)); 
    return this.servernounce.solve.call(null, nounce);

  }.bind(this);

  isRefreshed = (n)=>{((n - this.start) > HS.REFRESH_TIMEOUT)? true:false };
  postEvent = (e)=>{process.nextTick(() => {this.emit('state_event', e);})};
  postEventToContract = (e, data)=>{process.nextTick(() => {this.emit('contract_event', e, data);})};
};

ServerHandshake.prototype.sendRequest = async function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return null;
  }

  this.start = now;
  let {Pb} = await this.session.call();
  console.log("Pb:" + Pb.toString());

  Pb = Pb.toBuffer(32);
  //this.frame.sendFrame('Request', Pb);
  this.postEvent('request');
  return {type: "Request", nonce0: Pb};
}

ServerHandshake.prototype.waitChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  return true;
}

ServerHandshake.prototype.solveChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  console.log("solveChallenge");
  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  let nounce = this.lock_nounce;
  console.log("nounce:" + JSON.stringify(nounce));

  let match = this.solve(nounce);

  //Send server challenge only if Pm matches
  if (match == true) {
    this.postEvent('validated');
  }
  else
    this.postEvent('idle');
  return true;
}

ServerHandshake.prototype.createChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.update.call();
  this.postEvent('send');
  return true;
}

ServerHandshake.prototype.sendChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  //this.frame.sendFrame('Response', this.nounce);
  this.postEventToContract("response", this.nounce);
  this.postEvent('ack_pending');
  return true;
}

//ServerHandshake.prototype.
/*var server_hs = new ServerHandshake();

server_hs.on('state_event', (event) => {

  state = machine.transition(state, event);
});

server_hs.frame.on('request', (data) => {

  server_hs.postEvent('request');
});

server_hs.frame.on('challenge', (data) => {

  server_hs.lock_nounce = data.nounce; //data.slice(0, 131);
  server_hs.postEvent('challenge');
});
*/
module.exports = {
  ServerHandshake: ServerHandshake
};