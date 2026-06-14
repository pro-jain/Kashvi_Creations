// test.js
import { initProducer, publishEvent, disconnectProducer } from './services/kafkaProducer.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Connect to DB so we can get real IDs
await mongoose.connect(process.env.MONGODB_URI);

// Get a real user and product from DB
const user = await mongoose.connection.db.collection('Users').findOne({});
const product = await mongoose.connection.db.collection('Products').findOne({});
const order = await mongoose.connection.db.collection('Orders').findOne({});

if (!user || !product) {
  console.log('❌ No user or product found in DB. Insert them first via Atlas!');
  process.exit(1);
}

console.log('✅ Using user:', user.name, '| product:', product.name);

await initProducer();

const fakeOrderId = new mongoose.Types.ObjectId().toString();

await publishEvent('order-created', [{
  key: fakeOrderId,
  value: {
    orderId: fakeOrderId,
    userId: user._id.toString(),
    items: [{
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity: 1,
      size: 'M'
    }],
    totalAmount: product.price,
    address: {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@test.com',
      street: '12 MG Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      zipcode: '302001',
      country: 'India',
      phone: '9876543210'
    },
    timestamp: new Date()
  }
}]);

console.log('✅ Event sent! orderId:', fakeOrderId);
console.log('   Check your server console for: "Order confirmed and email sent"');

await disconnectProducer();
await mongoose.disconnect();
process.exit(0);