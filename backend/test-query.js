require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ERP_System')
  .then(async () => {
    console.log('Connected to MongoDB');

    const query = {
      isActive: true,
      role: { $in: ['student', 'teacher'] },
    };

    console.log('Running query:', JSON.stringify(query, null, 2));
    const users = await User.find(query);
    console.log('Query result count:', users.length);
    if (users.length > 0) {
      console.log('Sample user:', JSON.stringify(users[0], null, 2));
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });