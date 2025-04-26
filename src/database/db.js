import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config({path:".env"});

const prisma = new PrismaClient();

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; 

class DatabaseConnection {
    constructor() {
        this.retryCount = 0;
        this.isConnected = false;
  
        prisma.$on('connect', () => {
            console.log('✅ Postgres connected successfully');
            this.isConnected = true;
        });

        prisma.$on('error', (err) => {
            console.error('❌ Postgres connection error:', err);
            this.isConnected = false;
        });
        
        prisma.$on('disconnected', () => {
            console.log('⚠️ Postgres disconnected');
            this.isConnected = false;
            this.handleDisconnection();
        });
        
        process.on('SIGINT', async () => {
            console.log('Received SIGINT signal. Closing Prisma connection...');
            await prisma.$disconnect();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM signal. Closing Prisma connection...');
            await prisma.$disconnect();
            process.exit(0);
        });

    }

    async connect() {
        try {
            if (!process.env.DATABASE_URL) {
                throw new Error('Postgres URI is not defined in environment variables');
            }

            await prisma.$connect();

            if (process.env.NODE_ENV === 'development') {
                prisma.$on('query', (e) => {
                    console.log(e.query);
                });
            }
            console.log('✅ Postgres connected successfully');
            this.retryCount = 0; 
            
        } catch (error) {
            console.error('Failed to connect to Postgres:', error.message);
            await this.handleConnectionError();
        }
    }

    async handleConnectionError() {
        if (this.retryCount < MAX_RETRIES) {
            this.retryCount++;
            console.log(`Retrying connection... Attempt ${this.retryCount} of ${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            return this.connect();
        } else {
            console.error(`Failed to connect to Postgres after ${MAX_RETRIES} attempts`);
            process.exit(1);
        }
    }

    handleDisconnection() {
        if (!this.isConnected) {
            console.log('Attempting to reconnect to Postgres...');
            this.connect();
        }
    }

    async handleAppTermination() {
        try {
            await prisma.$disconnect();
            console.log('Postgres connection closed through app termination');
            process.exit(0);
        } catch (err) {
            console.error('Error during database disconnection:', err);
            process.exit(1);
        }
    }

    async getConnectionStatus() {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return {
                isConnected: true,
                host: process.env.DATABASE_URL,
                name: process.env.DATABASE_NAME
            };
        } catch {
            return {
                isConnected: false,
                host: process.env.DATABASE_URL,
                name: process.env.DATABASE_NAME
            };
        }
    }
}

const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);

export { prisma };