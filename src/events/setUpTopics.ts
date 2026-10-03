import { kafka } from "@/config/kafka.config";

// Admin does Infra Setup: Topics, Partitions creation

// Topics to create
const topicsToCreate = [
    {
        topic: "order-created",
        replicationFactor: 1,
        numPartitions: 3,
    },
    {
        topic: "user-updated",
        replicationFactor: 1,
        numPartitions: 1,
    }
];

async function init() {
    // Creating the admin instance
    const admin = kafka.admin();

    try {
        await admin.connect();
        console.log('Kafka admin connected');

        // Listing all existing topics
        const topics = await admin.listTopics();
        console.log(`Existing topics: ${topics}`);

        const created = await admin.createTopics({
            topics: topicsToCreate
        });

        console.log({ created });
    }
    catch (error) {
        console.log('Kafka initialization error');
    }
    finally {
        await admin.disconnect();
        console.log('Kafka admin disconnected');
    }
}

init();