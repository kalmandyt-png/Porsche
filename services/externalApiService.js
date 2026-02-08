const axios = require('axios');

const fetchCarDetailsByVin = async (vin) => {
  try {
    const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const results = response.data.Results;
    const processedInfo = {};
    return processedInfo;
  } catch (error) {
    console.error('Error fetching car details from external API:', error.message);
    throw new Error('Failed to fetch car details.');
  }
};

module.exports = {
    fetchCarDetailsByVin
};