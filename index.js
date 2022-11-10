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

const verifyJWToken = (req, res, next) => {
   const authHeaderToken = req.headers.authorization;

   if(!authHeaderToken){
       return res.status(401).send({message: 'Un-Authorized Entry !!!'});
   }
   const token = authHeaderToken.split(' ')[1];

   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
       if(err){
           return res.status(403).send({message: 'Illegal Access !!!'});
       }
       req.decoded = decoded;
       next();
   })
}

const runServer = async () => {
   const services = client.db('sangitasKitchen').collection('services');
   const reviews = client.db('sangitasKitchen').collection('reviews');

   // JWT
   app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d'})
      res.send({token})
  });

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

  app.post('/addService', async (req, res) => {
      const order = req.body;
      const result = await services.insertOne(order);
      res.send(result);
   });

  app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const serviceData = await services.findOne(query);
      res.send(serviceData);
   });

   // Review Route
   app.get('/review', verifyJWToken, async (req, res) => {
      const decodedToken = req.decoded;
            
      if(decodedToken.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access'})
      }

      let query = {};
      if (req.query.email) {
          query = {
            "user_info.email": req.query.email
          }
      }
      const cursor = reviews.find(query);
      const userReviews = await cursor.toArray();
      res.send(userReviews);
  });

   app.post('/review', async (req, res) => {
      const order = req.body;
      const result = await reviews.insertOne(order);
      res.send(result);
  });

  app.get('/review/:serviceId', async (req, res) => {
      const id = req.params.serviceId;
      let query = { "service.sid": id };
      const cursor = reviews.find(query).sort({date: -1});
      const serviceReview = await cursor.toArray();
      res.send(serviceReview);
   });

   app.patch('/review/:id', async (req, res) => {
      const id = req.params.id;
      const review = req.body.review;
      const query = { _id: ObjectId(id) }
      const updatedDoc = {
         $set:{
            review
         }
      }
      const result = await reviews.updateOne(query, updatedDoc);
      res.send(result);
   });

   app.delete('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviews.deleteOne(query);
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