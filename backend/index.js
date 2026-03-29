const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const stripe = require('stripe')(process.env.SECRET_KEY_STRIPE);

const app = express();

app.use(cors());
app.use(express.json());

// Caching middleware for public GE endpoints
const cacheMiddleware = (seconds) => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${seconds}`);
  next();
};

const serviceAccount = require('./serviceKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware to verify Firebase ID Token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send('Unauthorized');
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    if (user.customClaims && user.customClaims.admin) {
      next();
    } else {
      res.status(403).send('Forbidden: Admin access required');
    }
  } catch (error) {
    res.status(403).send('Forbidden');
  }
};

// API Endpoints

app.post('/api/users', authenticate, async (req, res) => {
  try {
    const { displayName, email, photoURL } = req.body
    const userRef = db.collection('users').doc(req.user.uid)
    const snap = await userRef.get()
    if (!snap.exists) {
      await userRef.set({
        uid: req.user.uid,
        email: email || req.user.email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      await userRef.update({
        displayName: displayName || snap.data().displayName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    res.status(200).send({ uid: req.user.uid })
  } catch (error) {
    console.error('Error saving user:', error)
    res.status(500).send('Internal Server Error')
  }
})

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, shipping, total, paymentMethod, paymentId } = req.body;
    const orderData = {
      items,
      shipping,
      total,
      paymentMethod,
      paymentId: paymentId || null,
      status: paymentMethod === 'card' ? 'paid' : 'pending_delivery',
      userId: req.user.uid,
      userEmail: req.user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('orders').add(orderData);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/payment/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { items, shipping, total } = req.body;
    const origin = req.get('origin') || 'http://localhost:5173';

    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.metadataUrl ? [item.metadataUrl] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (subtotal <= 150) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: 1299, // $12.99
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        userId: req.user.uid,
        userEmail: req.user.email,
        shipping: JSON.stringify(shipping),
        items: JSON.stringify(items.map(i => ({ 
          id: i.id, 
          quantity: i.quantity, 
          name: i.name, 
          price: i.price,
          metadataUrl: i.metadataUrl || null,
          image: i.image || null,
          modelPath: i.modelPath || null,
          type: i.type || '2d'
        })))
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});



app.get('/api/payment/session/:sessionId', authenticate, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/confirm-stripe', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).send('Payment not completed');
    }

    // Check if order already exists for this session to prevent duplicates
    const existing = await db.collection('orders').where('paymentId', '==', sessionId).get();
    if (!existing.empty) {
      return res.status(200).send({ id: existing.docs[0].id });
    }

    const metadata = session.metadata;
    const shipping = JSON.parse(metadata.shipping);
    const itemsSummary = JSON.parse(metadata.items);
    
    // Prioritize full items from request body (including customization) over metadata summary
    const finalItems = req.body.items || itemsSummary;

    const orderData = {
      items: finalItems, 
      shipping,
      total: (session.amount_total / 100).toFixed(2),
      paymentMethod: 'card',
      paymentId: sessionId,
      status: 'paid',
      userId: req.user.uid,
      userEmail: req.user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('orders').add(orderData);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    console.error('Error confirming stripe order:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/orders/my', authenticate, async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', req.user.uid)
      .get()
    
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    orders.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt._seconds || a.createdAt.seconds || 0) : 0;
      const timeB = b.createdAt ? (b.createdAt._seconds || b.createdAt.seconds || 0) : 0;
      return timeB - timeA;
    });

    res.status(200).json(orders)
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).send('Internal Server Error')
  }
})

app.get('/api/admin/orders', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get()
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).send('Internal Server Error')
  }
})

app.get('/api/products/counts', cacheMiddleware(300), async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const counts = {
      sneakers: 0,
      hoodies: 0,
      jackets: 0,
      tees: 0
    };
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category;
      if (data.type === '2d' && counts.hasOwnProperty(category)) {
        counts[category]++;
      }
    });
    res.status(200).json(counts);
  } catch (error) {
    console.error('Error fetching product counts:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/products', authenticate, isAdmin, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('products').add(productData);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('products').doc(productId).update(updateData);
    res.status(200).send({ id: productId });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/gallery', cacheMiddleware(300), async (req, res) => {
  try {
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    const galleryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(galleryItems);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/gallery', authenticate, isAdmin, async (req, res) => {
  try {
    const artworkData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('gallery').add(artworkData);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/api/gallery/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const itemId = req.params.id;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('gallery').doc(itemId).update(updateData);
    res.status(200).send({ id: itemId });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/gallery/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const itemId = req.params.id;
    await db.collection('gallery').doc(itemId).delete();
    res.status(200).send({ id: itemId });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
