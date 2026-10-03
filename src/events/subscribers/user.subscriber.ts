import { kafka } from "@/config/kafka.config";

// list of topics to listen/subscribe to
const topics = ["order-created", "user-updated"];

async function init() {
    /*
        Every consumer belongs to a consumer group.
        GroupId refers to the consumer group id.
    */
    const consumer = kafka.consumer({ groupId: 'user-service-group' });
    
    // connecting to consumer instance
    await consumer.connect();
    console.log('Consumer connected');

    // subscribing/listening to topics
    /*
        fromBeginning: true -> Starts reading from the earliest available message stored in the topic (Offset 0 or the oldest non-retracted message).
        fromBeginning: false(Default) -> Ignores historical messages and starts reading only new messages produced after the consumer connects.
    */
    await consumer.subscribe({
        topics: topics,
        fromBeginning: true
    });

    console.log(`Consumer subscribed to topics: ${topics}`);

    // consumer handler, i.e. for each message what we want to perform
    await consumer.run({
        eachMessage: async ({ message, partition, topic }) => {

            /*
                logging details:
                1) which topic is the consumer subscribed to
                2) which partition the message came from
                3) which offset in that partition the current message is at
            */
            console.log(`Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`);

            // Parsing JSON string back into an object
            const orderData = JSON.parse(message.value!.toString());

            console.log(`Sending user update notification to: ${orderData.userEmail} with orderId: ${orderData.orderId}`);
        }
    });
}

init();