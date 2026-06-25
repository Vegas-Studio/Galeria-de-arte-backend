const sequelize = require('./config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await sequelize.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar bytea;');
    console.log('Column avatar added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await sequelize.close();
  }
}

run();
