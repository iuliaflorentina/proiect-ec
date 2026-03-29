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

// Caching middleware that ensures data is always fresh via ETags (revalidation)
// browser caches the response, but checks with server each time
const cacheMiddleware = (seconds = 0) => (req, res, next) => {
  if (seconds > 0) {
    res.set('Cache-Control', `public, max-age=${seconds}, no-cache, must-revalidate`);
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
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

/**
 * Transparent Image Proxy
 * Used to bypass CORS for 3D textures/decals from external origins (Firebase Storage)
 */
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL is required');

  try {
    // Only allow specific trusted domains (optional, but safer)
    if (!url.includes('firebasestorage.googleapis.com') && !url.includes('cdn-icons-png.flaticon.com') && !url.includes('api.iconify.design')) {
      return res.status(403).send('Forbidden origin');
    }

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000
    });

    // Mirror necessary headers for 3D textures
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send('Error fetching remote image');
  }
});

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
    const { items, shipping, total, paymentMethod, paymentId, couponCode } = req.body;
    
    // SERVER-SIDE TOTAL RE-CALCULATION (Security)
    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (couponCode) {
      const couponSnap = await db.collection('coupons').where('code', '==', couponCode.toUpperCase()).get();
      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();
        const now = admin.firestore.Timestamp.now();
        if (coupon.active && (!coupon.expiresAt || coupon.expiresAt.toDate() > now.toDate()) && subtotal >= (coupon.minAmount || 0)) {
          if (coupon.type === 'percent') discount = subtotal * (coupon.value / 100);
          else if (coupon.type === 'fixed') discount = Math.min(coupon.value, subtotal);
        }
      }
    }

    const shippingCost = subtotal > 150 ? 0 : 12.99;
    const finalTotal = (subtotal - discount + shippingCost).toFixed(2);

    const orderData = {
      items,
      shipping,
      total: finalTotal,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      shippingCost,
      couponCode: couponCode || null,
      paymentMethod,
      paymentId: paymentId || null,
      status: paymentMethod === 'card' ? 'paid' : 'pending',
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

// Coupon Validation
app.post('/api/coupons/validate', authenticate, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const couponSnap = await db.collection('coupons').where('code', '==', code.toUpperCase()).get();
    
    if (couponSnap.empty) return res.status(404).send('Coupon not found');
    
    const coupon = couponSnap.docs[0].data();
    const now = admin.firestore.Timestamp.now();

    if (!coupon.active) return res.status(400).send('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt.toDate() < now.toDate()) return res.status(400).send('Coupon has expired');
    if (subtotal < (coupon.minAmount || 0)) return res.status(400).send(`Minimum order amount of $${coupon.minAmount} required`);

    res.status(200).send({
      id: couponSnap.docs[0].id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Public Active Coupons for Hero & Profile
app.get('/api/coupons/active', async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    console.log('Public active coupons requested at:', now.toDate());
    const snap = await db.collection('coupons')
      .where('active', '==', true)
      .get();
    
    // Filter by expiration date in memory (Firestore limited on multiple inequality filters)
    const coupons = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(c => !c.expiresAt || c.expiresAt.toDate() > now.toDate());
      
    res.status(200).send(coupons);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// Admin Coupon Management
app.get('/api/admin/coupons', authenticate, isAdmin, async (req, res) => {
  try {
    const snap = await db.collection('coupons').orderBy('createdAt', 'desc').get();
    const coupons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(coupons);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/admin/coupons', authenticate, isAdmin, async (req, res) => {
  try {
    const { code, type, value, minAmount, expiresAt } = req.body;
    const couponData = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minAmount: Number(minAmount || 0),
      expiresAt: (expiresAt && expiresAt !== '') ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('coupons').add(couponData);
    res.status(201).send({ id: docRef.id, ...couponData });
  } catch (error) {
    res.status(500).send('Error creating coupon');
  }
});

app.delete('/api/admin/coupons/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('coupons').doc(req.params.id).delete();
    res.status(200).send('Coupon deleted');
  } catch (error) {
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

    // Handle Discount
    const { couponCode } = req.body;
    let discount = 0;
    let discounts = [];

    if (couponCode) {
      const couponSnap = await db.collection('coupons').where('code', '==', couponCode.toUpperCase()).get();
      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();
        const now = admin.firestore.Timestamp.now();
        
        // Re-validate security checks
        const isValid = coupon.active && 
                        (!coupon.expiresAt || coupon.expiresAt.toDate() > now.toDate()) &&
                        (subtotal >= (coupon.minAmount || 0));

        if (isValid) {
          const discountVal = coupon.type === 'percent' 
            ? subtotal * (coupon.value / 100) 
            : Math.min(coupon.value, subtotal);
          
          discount = discountVal; // Track for our database metadata
          
          // Create a one-time Stripe coupon for this session
          const stripeCoupon = await stripe.coupons.create({
            name: `Discount (${coupon.code})`,
            percent_off: coupon.type === 'percent' ? coupon.value : undefined,
            amount_off: coupon.type === 'fixed' ? Math.round(coupon.value * 100) : undefined,
            currency: coupon.type === 'fixed' ? 'usd' : undefined,
            duration: 'once',
          });

          discounts.push({ coupon: stripeCoupon.id });
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      discounts,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        userId: req.user.uid,
        userEmail: req.user.email,
        shipping: JSON.stringify(shipping),
        couponCode: couponCode ? String(couponCode) : "",
        discount: discount.toFixed(2)
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
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

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
    
    // Use items from request body (which we send from localStorage in the frontend)
    const finalItems = req.body.items || [];
    if (finalItems.length === 0) {
      return res.status(400).send('Missing order items');
    }

    // Recalculate component costs for database consistency
    const subtotal_cents = finalItems.reduce((acc, item) => {
       return acc + (Math.round(item.price * 100) * item.quantity);
    }, 0);
    const shipping_cents = subtotal_cents > 15000 ? 0 : 1299;

    const orderData = {
      items: finalItems, 
      shipping,
      total: (session.amount_total / 100).toFixed(2),
      subtotal: (subtotal_cents / 100).toFixed(2),
      discount: metadata.discount || "0.00",
      couponCode: metadata.couponCode && metadata.couponCode !== "null" ? metadata.couponCode : null,
      shippingCost: (shipping_cents / 100).toFixed(2),
      paymentMethod: 'card',
      paymentId: sessionId,
      receiptUrl: session.payment_intent?.receipt_url || null,
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

app.patch('/api/admin/orders/:id/status', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'received', 'processing', 'shipped', 'delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).send('Invalid status');
  }

  try {
    await db.collection('orders').doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).send({ id, status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Internal Server Error');
  }
})

app.get('/api/products/counts', async (req, res) => {
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

app.get('/api/products', cacheMiddleware(10), async (req, res) => {
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

app.delete('/api/products/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    // Optional: Also delete associated reviews? 
    // Usually better to keep them or mark product as archived, 
    // but the user asked for "delete method".
    await db.collection('products').doc(productId).delete();
    res.status(200).send({ id: productId });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/gallery', cacheMiddleware(10), async (req, res) => {
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

// Reviews API

// GET all reviews with product info
app.get('/api/reviews', async (req, res) => {
  try {
    const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching global reviews:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET reviews for a specific product
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const snapshot = await db
      .collection('reviews')
      .where('productId', '==', req.params.productId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).send('Internal Server Error');
  }
});

// POST a new review (Authenticated + Verified Purchase)
app.post('/api/reviews', authenticate, async (req, res) => {
  const { productId, productName, rating, comment, orderId } = req.body;

  if (!productId || !rating || !orderId) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // 1. Verify payment/order exists for this user and contains the product
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).send('Order not found');
    }

    const orderData = orderDoc.data();
    if (orderData.userId !== req.user.uid) {
      return res.status(403).send('Unauthorized: You can only review your own orders');
    }

    // User can only write a review once the order is 'delivered'
    if (orderData.status !== 'delivered') {
      return res.status(400).send('You can only review items after the order is delivered');
    }

    const hasProduct = (orderData.items || []).some(item => 
      item.productId === productId || item.id === productId || item.name === productName
    );

    if (!hasProduct) {
      return res.status(400).send('Product not found in this order');
    }

    // 2. Check if already reviewed for this product in this order
    const existing = await db.collection('reviews')
      .where('userId', '==', req.user.uid)
      .where('productId', '==', productId)
      .where('orderId', '==', orderId)
      .get();

    if (!existing.empty) {
      return res.status(400).send('You have already reviewed this product for this order');
    }

    // 3. Create review
    const reviewData = {
      userId: req.user.uid,
      userName: req.user.name || orderData.shipping?.firstName || 'Anonymous',
      userEmail: req.user.email,
      productId,
      productName,
      orderId,
      rating: Number(rating),
      comment: comment || '',
      verified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const reviewRef = await db.collection('reviews').add(reviewData);

    // 4. Update Product aggregation (denormalization)
    const productRef = db.collection('products').doc(productId);
    await db.runTransaction(async (transaction) => {
      const pDoc = await transaction.get(productRef);
      if (pDoc.exists) {
        const pData = pDoc.data();
        const oldRating = pData.rating || 0;
        const oldCount = pData.reviews || 0;
        const newCount = oldCount + 1;
        const newRating = ((oldRating * oldCount) + Number(rating)) / newCount;

        transaction.update(productRef, {
          rating: Number(newRating.toFixed(1)),
          reviews: newCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    res.status(201).json({ id: reviewRef.id, ...reviewData });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).send('Internal Server Error');
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Cloud Functions
module.exports = app;
