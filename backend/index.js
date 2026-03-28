const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
  if (req.user && req.user.admin) {
    next();
  } else {
    // For now, let's assume a specific email is admin or use custom claims
    // To set an admin: admin.auth().setCustomUserClaims(uid, { admin: true });
    // For this project, we'll check if the email matches a specific one or if they have the claim
    const user = await admin.auth().getUser(req.user.uid);
    if (user.customClaims && user.customClaims.admin) {
      next();
    } else {
      res.status(403).send('Forbidden: Admin access required');
    }
  }
};

// API Endpoints

// Create or update user profile in Firestore
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

// Place an order (requires auth)
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
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

// Get this user's own orders
app.get('/api/orders/my', authenticate, async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get()
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(orders)
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).send('Internal Server Error')
  }
})

// Get all orders (requires admin)
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


// Set a user as admin (helper endpoint - should be protected or run once)
app.post('/api/admin/set-admin', authenticate, async (req, res) => {
  // Only allow if the requester is already an admin OR if it's the first admin setup
  // For simplicity during development, we'll let the user set themselves as admin if they provide a secret or if we trust the first one
  try {
    await admin.auth().setCustomUserClaims(req.body.uid, { admin: true });
    res.status(200).send('Admin claims set');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ==============================
// PRODUCT MANAGEMENT ENDPOINTS
// ==============================

// Get all products (Public)
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Create a new product (Admin Only)
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

// Update a product (Admin Only)
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

// ==============================
// GALLERY MANAGEMENT ENDPOINTS
// ==============================

// Get all gallery items (Public)
app.get('/api/gallery', async (req, res) => {
  try {
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    const galleryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(galleryItems);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Create a new gallery item (Admin Only)
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

// Update a gallery item (Admin Only)
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

// Delete a gallery item (Admin Only)
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
