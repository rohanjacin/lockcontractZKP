import { createLightNode,
		 waitForRemotePeer,
		 Protocols,
		 createDecoder,
		 createEncoder } from "@waku/sdk";

class Waku {
	constructor () {
		this.node = null;
		this.ContentTopic = "/waku-workshop/1/talk-feedback/json";
		this.PubsubTopic = "/waku/2/default-waku/proto";
		this.decoder = createDecoder(this.ContentTopic, this.PubsubTopic);
		this.encoder = createEncoder({ contentTopic: this.ContentTopic,
							pubsubTopic: this.PubsubTopic});
		this.receiveMessages = async function () {

			const callback = (message) => {
				if(!message.payload) return;

				const payload = message.payload;
				console.log("payload:", String.fromCharCode(...payload));
			}

			//console.log("this.node:", this.node);
			const subscription = await this.node.filter.createSubscription(this.PubsubTopic);

			await subscription.subscribe([this.decoder], callback);
		}
	}

	async start () {
		this.node = await createLightNode({
		  deafulBootstrap: false,
	      bootstrapPeers: [
	          "/dns4/node-01.gc-us-central1-a.wakuv2.prod.statusim.net/tcp/8000/wss/p2p/16Uiu2HAmVkKntsECaYfefR1V2yCR79CegLATuTPE6B9TxgxBiiiA",
	          "/dns4/node-01.ac-cn-hongkong-c.wakuv2.prod.status.im/tcp/8000/wss/p2p/16Uiu2HAm4v86W3bmT1BiH6oSPzcsSr24iDQpSN5Qa992BCjjwgrD",
	          "/dns4/node-01.do-ams3.wakuv2.test.status.im/tcp/8000/wss/p2p/16Uiu2HAmPLe7Mzm8TsYUubgCAW1aJoeFScxrLj8ppHFivPo97bUZ"
	      ]
		});

		await this.node.start();
		console.log("Started");
		await waitForRemotePeer(this.node, [Protocols.LighPush, Protocols.Filter]);
		console.log("Waited");

		await this.receiveMessages();
	}
}


const waku = new Waku();

waku.start();

console.log("Done");