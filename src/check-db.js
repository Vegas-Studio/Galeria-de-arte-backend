const sequelize = require('./config/database');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Columns in users table:', results);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
