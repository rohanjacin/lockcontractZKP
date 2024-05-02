var BN = require('bn.js');
var Frame = require('./socket/udp_server.js');
var hsm = require('./hsm.js');
const HSCurve = require('./hs_curve25519.js');
const util = require('util');
const EventEmitter = require('events');

const HS = {
  REFRESH_TIMEOUT: 30000
}

var server_hs;

var ServerHandshake;
(function() {
    var instance;

ServerHandshake = function ServerHandshake () {
    if (instance)
        return instance;

  instance = this;
  server_hs = this;
  EventEmitter.call(this);

  this.machine = hsm.createMachine(SM);
  this.state = this.machine.value;

  this.start = new BN();
  this.end = new BN();
  this.frame = new Frame();
  this.buildStateEventHandler();

  let counter = new BN(0, 16);
  let counter_steps = new BN(1, 16);
  let time = new BN(Math.floor(Date.now()/1000), 16);
  //let servernounce = new ServerNounce(time, counter);
  this.nounce = 0;//servernounce.nounce;
  this.lock_nounce = 0;

  this.session = function () {

    counter = counter.add(counter_steps);
    time = new BN(Math.floor(Date.now()/1000), 16);
    console.log("new session " + "ts:" + time +
     " counter:" + counter /*+ " nounce:" + JSON.stringify(servernounce.nounce)*/);
    
    this.postEventToContract("request");
    return true; //return servernounce.session.call(null, time);

  }.bind(this);

  this.update = function () {

    //console.log("Handshake Session Update");
    //servernounce.update.call(null, time, counter);
    this.nounce = 0;//servernounce.nounce;

    console.log("\nSERVER NONCE:" + JSON.stringify(this.nounce));
    //console.log("\nLENGTH:" + this.nounce.length);

  }.bind(this);

  this.solve = function (nounce) {
     
    return 1; //return servernounce.solve.call(null, nounce);

  }.bind(this);

  this.isRefreshed = (n)=>{((n - this.start) > HS.REFRESH_TIMEOUT)? true:false };
  this.postEvent = (e)=>{process.nextTick(() => {this.emit('state_event', e);})};
  this.postEventToContract = (e, data)=>{process.nextTick(() => {this.emit('contract_event', e, data);})};

};
}());

util.inherits(ServerHandshake, EventEmitter);

ServerHandshake.prototype.sendRequest = function (pb_x, pb_y) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.start = now;
  
  //Convert from bigInt to BN
  let Pb_x = new BN(pb_x);
  let Pb_y = new BN(pb_y);

  console.log(`Pb_x:` + Pb_x);
  console.log(`Pb_y:` + Pb_y);

  let curve = new HSCurve();
  let Pb;

  Pb = curve.createPointFromPublic('secp256k1', {x:Pb_x, y:Pb_y});
  
  console.log("Pb:" + Pb.toString());
  Pb = Pb.getPublic('string');
  Pb = new BN(Pb, 16);
  Pb = Pb.toBuffer(32);

  this.frame.sendFrame('Request', Pb);
  this.postEvent('request');
  return true;
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

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
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

ServerHandshake.prototype.validate = function (matched) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  if (matched)
    this.postEvent('validated');
  else
    this.postEvent('idle');
}

ServerHandshake.prototype.createChallenge = function () {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.postEventToContract("response");

  //this.update.call();
  //this.postEvent('send');
  return true;
}

ServerHandshake.prototype.sendChallenge = function (nonce) {
  let now = new BN(Math.floor(Date.now()/1000), 16);

  if (this.isRefreshed(now) == false) {

    console.log("ServerHandshake FSM not refreshed");
    this.postEvent('idle');
    return false;
  }

  this.frame.sendFrame('Response', nonce);
  this.postEvent('ack_pending');
  return true;
}

ServerHandshake.prototype.buildStateEventHandler = function () {

  this.on('state_event', function(event) {

    this.state = this.machine.transition(this.state, event);
  }.bind(this));

  /*this.frame.on('request', function(data) {

    this.postEvent('request');
  }.bind(this));
  */

  this.frame.on('challenge', function(data) {

    this.lock_nounce = data.nounce; //data.slice(0, 131);
    this.postEvent('challenge');
  }.bind(this));
}

const SM = {

  initialState: 'idle',

  idle: {

    actions: {

      onEnter() {

        //console.log('idle: onEnter')
      },

      onExit() {

        //console.log('idle: onExit')

      },

    },

    transitions: {

      request: {

        target: 'waiting',

        action() {

          console.log('transition action for "request" in "idle" state');


        },

      },

    },

  },

  waiting: {

    actions: {

      onEnter() {

        server_hs.waitChallenge();
      },

      onExit() {

        //console.log('waiting: onExit')

      },

    },

    transitions: {

      challenge: {

        target: 'response',

        action() {

          console.log('transition action for "challenge" in "waiting" state')
          server_hs.solveChallenge();
        },

      },

    },

  },


  response: {

    actions: {

      onEnter() {

        console.log('challenge: onEnter')
        
      },

      onExit() {

        console.log('challenge: onExit')

      },

    },

    transitions: {

      validated: {

        target: 'response',

        action() {
          server_hs.createChallenge();
        }
      },

      send: {

        target: 'ack_pending',

        action() {

          console.log('transition action for "send" in "challenge" state')
          //server_hs.sendChallenge();
        },

      },

    },

  },

  ack_pending: {

    actions: {

      onEnter() {

        console.log('ack_pending: onEnter')

      },

      onExit() {

        console.log('ack_pending: onExit')

      },

    },

    transitions: {

      response: {

        target: 'ack',

        action() {

          console.log('transition action for "response" in "response_pending" state')

        },

      },

    },

  },

  ack: {

    actions: {

      onEnter() {

        //console.log('ack: onEnter')

      },

      onExit() {

        //console.log('ack: onExit')

      },

    },

    transitions: {

      done: {

        target: 'idle',

        action() {

          console.log('transition action for "done" in "ack" state')

        },

      },

    },

  }
}

module.exports = ServerHandshake;