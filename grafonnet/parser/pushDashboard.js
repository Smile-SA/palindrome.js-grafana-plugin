const axios = require('axios');
const dashboard = require('../myDashboard.json');
require('dotenv').config();

const pushDashboard = async () => {
    axios.post(`${process.env.GRAFNA_URL}/api/dashboards/db`, {
        "dashboard": dashboard
    });
};

const main = async () => {
    await pushDashboard();
}

main();