import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGO_URI = process.env.MONGO_DEV || 'mongodb://localhost:27017/Kickup';

async function seed() {
    console.log('🌱 Starting Banner Seeding...');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const membersCollection = db.collection('members');
        const bannersCollection = db.collection('banners');

        // 1. Find an Admin user or any user for authorId
        let admin = await membersCollection.findOne({ memberType: 'ADMIN' });
        if (!admin) {
            console.log('⚠️ No ADMIN user found. Searching for any user...');
            admin = await membersCollection.findOne({});
        }

        let authorId;
        if (!admin) {
            console.log('⚠️ No users found in database. Using a dummy ObjectId for authorId.');
            authorId = new mongoose.Types.ObjectId();
        } else {
            authorId = admin._id;
        }

        // 2. Clear existing banners (optional, but good for fresh start)
        await bannersCollection.deleteMany({});
        console.log('🧹 Cleared existing banners');

        // 3. Define 5 Premium Banners with English text
        const banners = [
            {
                bannerType: 'IMAGE',
                bannerStatus: 'ACTIVE',
                bannerTitle: "Play on the Best Fields",
                bannerDesc: 'Professional venues, friendly community, and unforgettable matches await.',
                bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000',
                authorId: authorId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                bannerType: 'IMAGE',
                bannerStatus: 'ACTIVE',
                bannerTitle: 'Futsal Night League',
                bannerDesc: 'Experience fast-paced action and an electric atmosphere. Book your spot now!',
                bannerUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=80&w=2000',
                authorId: authorId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                bannerType: 'IMAGE',
                bannerStatus: 'ACTIVE',
                bannerTitle: 'Compete in Tournaments',
                bannerDesc: 'Showcase your skills and win amazing prizes with your team.',
                bannerUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=2000',
                authorId: authorId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                bannerType: 'IMAGE',
                bannerStatus: 'ACTIVE',
                bannerTitle: 'Make New Friends',
                bannerDesc: "It's not just football, it's about being part of our global sports family.",
                bannerUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=2000',
                authorId: authorId,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                bannerType: 'IMAGE',
                bannerStatus: 'ACTIVE',
                bannerTitle: 'KickUp: All for Football',
                bannerDesc: 'From finding fields to organizing matches — we are here for you.',
                bannerUrl: 'https://images.unsplash.com/photo-1551952237-954a0e68786c?auto=format&fit=crop&q=80&w=2000',
                authorId: authorId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // 4. Insert Banners
        await bannersCollection.insertMany(banners);
        console.log(`✅ Successfully seeded ${banners.length} banners!`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

seed();
