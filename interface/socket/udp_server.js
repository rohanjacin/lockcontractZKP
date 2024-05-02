const udp = require('dgram')
const conf = require('./config/config')
const util = require('util');
const EventEmitter = require('events');

const {
    log
} = require('./util/loggerTool')

var client;

var UdpServer;
(function() {
    var instance;

UdpServer = function UdpServer () {
    if (instance)
        return instance;

  instance = this;
  EventEmitter.call(this);

    client = udp.createSocket('udp4');

    client.on('message', (msg,info) => {
        log("udp_server", "info", msg.toString() + ` | Received ${msg.length} bytes from ${info.address}:${info.port}`)
        this.address = info.address; this.port = info.port;
        this.parseFrame(msg);
    });

    setTimeout( () => {
        client.close()
    },conf.timeout)    

};
}());

util.inherits(UdpServer, EventEmitter);


UdpServer.prototype.parseFrame = function (data) {
    let frame = JSON.parse(data);
    //console.log("frame:" + JSON.stringify(frame));

    switch (frame.type) {
        case 'Challenge':
        this.emit('challenge', frame);
        break;

        case 'Ack':
        console.log("Ack frame");
        break;

        default:
        console.log("Invalid frame");
        break;
    }
}

UdpServer.prototype.sendFrame = function (type, data) {

    let send = false;
    let timestp = new Date()
    const frame = {
        type: type,
        timestamp: timestp.toJSON(),
    }

    switch (type) {
        case 'Request':
        console.log("Request frame sent");
        frame.description = 'Request by Server';
        frame.pb = data;
        send = true;
        break;

        case 'ResponsePending':
        console.log("ResponsePending frame sent");
        frame.description = 'ResponsePending by Server';
        send = true;
        break;

        case 'Response':
        console.log("Response frame sent");
        frame.description = 'Response by Server';
        frame.nounce = data;
        send = true;
        break;

        default:
        console.log("Invalid frame");
        break;
    }

    if (send == false)
        return;

    console.log("frame:" + JSON.stringify(frame));
    const buf = Buffer.from(JSON.stringify(frame))

    client.send(buf, conf.port, conf.host, error => {
        if (error) {
            console.log(error)
            client.close()
        } else {
            //console.log('Frame sent !!!')
        }
    })
}

/*const data1 = Buffer.from('hello')
const data2 = Buffer.from('world')

//sending multiple msg
client.send([ data1, data2 ], conf.port, conf.host, error => {

    if(error){
        console.log(error)
        client.close()
    }else{
        console.log('Data sent !!!')
    }
})
*/

//var udpserver = new UdpServer();
//udpserver.sendFrame('Request');
module.exports = UdpServer;