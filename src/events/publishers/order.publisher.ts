import { kafka } from "@/config/kafka.config";

// creating a producer instance
const producer = kafka.producer();

export class OrderPublisher {

    async connect() {
        await producer.connect();
        console.log('Connected to Kafka successfully');
    }

    async disconnect() {
        await producer.disconnect();
        console.log('Order service disconnected');
    }

    async publishOrderCreated(orderData: any) {
        /*
            Key decides which partition the message goes to.
            If Key is undefined, message goes to random partition
        */
        const key = orderData.userEmail || Date.now().toString();
        console.log('Sending order-created event');

        // sending message to topic: 'order-created'
        await producer.send({
            topic: 'order-created',
            /*
                message contains:
                key: Unique identifier of the message
                value: Message Payload. JSON.stringify converts js object into a json string before sending.
            */
            messages: [
                {
                    key: key, // partition = hash(key) % number_of_partitions
                    value: JSON.stringify({
                        ...orderData,
                        timeStamp: new Date().toISOString()
                    }),
                },
            ],
        });

        return key;
    }

    async publishUserUpdated(userEmail: any, orderId: any) {
        // sending message to topic: 'user-updated'
        await producer.send({
            topic: 'user-updated',
            messages: [
                {
                    key: userEmail,
                    value: JSON.stringify({
                        orderId,
                        userEmail,
                        timeStamp: new Date().toISOString()
                    }),
                },
            ],
        });
    }
    
}