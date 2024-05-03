const udp = require('dgram')
const conf = require('./config/config')
const util = require('util');
const EventEmitter = require('events');

const {
    log
} = require('./util/loggerTool')

var server;

var UdpLock;
(function() {
    var instance;

UdpLock = function UdpLock () {
    if (instance)
        return instance;

  instance = this;
  EventEmitter.call(this);
  this.port = this.address = '';

    server = udp.createSocket('udp4')

    server.on('error', (error) => {
        log("udp_lock", "error", error)
        server.close()
    })

    server.on('message', (msg,info) => {
        log("udp_lock", "info", msg.toString() + ` | Received ${msg.length} bytes from ${info.address}:${info.port}`)
        this.address = info.address; this.port = info.port;
        this.parseFrame(msg);
/*        let timestp = new Date()
        const frame = {
            type: 'Challenge',
            description: 'Challenge by Lock',
            //serverPort: conf.port,
            timestamp: timestp.toJSON(),
    //        received: {
     //           message: msg.toString(),
     //           fromIP: info.address,
      //          fromPort: info.port
       //     }
        }
        const data = Buffer.from(JSON.stringify(frame))

        //sending msg
        server.send(data, info.port, info.address, (error, bytes) => {
            if(error){
                log("udp_lock", "error", error)
                client.close()
            } else {
                log("udp_lock", "info", 'Frame ${frame.type} sent !!!')
            }    
        })*/
    })  // end server.on


    server.on('listening', () => {
        const address = server.address()
        const port = address.port
        const family = address.family
        const ipaddr = address.address

        log("udp_lock", "info", 'Server is listening at port ' + port)
        log("udp_lock", "info", 'Server ip :' + ipaddr)
        log("udp_lock", "info", 'Server is IP4/IP6 : ' + family)
    })

    server.on('close', () => {
        log("udp_lock", "info", 'Socket is closed !')
    })

    server.bind(conf.port)
};
}());

util.inherits(UdpLock, EventEmitter);

UdpLock.prototype.parseFrame = function (data) {
    let frame = JSON.parse(data);
    //console.log("frame:" + JSON.stringify(frame));

    switch (frame.type) {
        case 'Request':
        //console.log("Request frame");
        this.emit('request', frame);
        break;

        case 'ResponsePending':
        console.log("Response Pending frame");
        break;

        case 'Response':
        //console.log("Response frame");
        this.emit('response', frame);
        break;

        default:
        console.log("Invalid frame");
        break;
    }
}

UdpLock.prototype.sendFrame = function (type, data) {

    let send = false;
    let timestp = new Date()
    const frame = {
        type: type,
        timestamp: timestp.toJSON(),
    }

    switch (type) {
        case 'Challenge':
        console.log("Challenge frame sent");
        frame.description = 'Challenge by Lock';
        frame.nounce = data;
        send = true;
        break;

        case 'Ack':
        console.log("Ack frame sent");
        frame.description = 'Ack by Lock';
        frame.status = data;
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

    //sending msg
    server.send(buf, this.port, this.address, (error, bytes) => {
        if(error){
            log("udp_lock", "error", error)
        } else {
            log("udp_lock", "info", 'Frame ${frame.type} sent !!!')
        }    
    })
}
//var udplock = new UdpLock()
module.exports = UdpLock;