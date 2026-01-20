const PayOS = require('@payos/node');
require('dotenv').config();

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID || "df30b0bb-44e2-432a-b319-aa0e83aaae6e",
  process.env.PAYOS_API_KEY || "0176a0e6-9030-4f74-b565-ec148d30adc8",
  process.env.PAYOS_CHECKSUM_KEY || "b92e0570dc01fb219fb0ca08675beb1babe5999f6db8e0384a86a042cc739421"
  // partnerCode is optional; omit if not needed
);

console.log('PayOS initialized with clientId:', process.env.PAYOS_CLIENT_ID); // Debug log

module.exports = payOS;