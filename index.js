const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.SERVER_USER}:${process.env.SERVER_PASSWORD}@cluster0.b18cp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const runServer = async () => {
   const services = client.db('sangitasKitchen').collection('services');
   const reviews = client.db('sangitasKitchen').collection('reviews');

   // Services Route
   app.get('/services', async (req, res) => {
      const limitSize = req.headers.limitsize;
      const query = {}
      const cursor = services.find(query);

      if (limitSize) {
         const servicesData = await cursor.limit(3).toArray();
         return res.send(servicesData);
      }else{
         const servicesData = await cursor.toArray();
         return res.send(servicesData);
      }
  });

  app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const serviceData = await services.findOne(query);
      res.send(serviceData);
   });

   // Review Route
   app.post('/review', async (req, res) => {
      const order = req.body;
      const result = await reviews.insertOne(order);
      res.send(result);
  });
}

runServer().catch(error => console.error(error));

app.get('/', (req, res) => {
   res.send('Service Review Server Side.')
})

app.listen(port, () => {
   console.log(`Server Running On ${port}`);
})