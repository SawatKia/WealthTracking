const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { defineString } = require('firebase-functions/params');


const firebaseConfig = {
    API_KEY: defineString('API_KEY'),
    AUTH_DOMAIN: defineString('AUTH_DOMAIN'),
    PROJECT_ID: defineString('PROJECT_ID'),
    STORAGE_BUCKET: defineString('STORAGE_BUCKET'),
    MESSAGING_SENDER_ID: defineString('MESSAGING_SENDER_ID'),
    APP_ID: defineString('APP_ID'),
    MEASUREMENT_ID: defineString('MEASUREMENT_ID'),
  };
const app = initializeApp(firebaseConfig);

export const db = getFirestore();