const axios = require('axios');
const dashboard = require('../dashboard.json');

const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });

const pushDashboard = async () => {
    axios.post(`${process.env.GRAFNA_URL}/api/dashboards/db`, {
        "dashboard": dashboard
    });
};

const main = async () => {
    await pushDashboard();
}

main();