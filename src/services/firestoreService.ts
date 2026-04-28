import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestoreService = {
  // Trends
  async addTrend(trend: any) {
    const path = "trends";
    try {
      return await addDoc(collection(db, path), {
        ...trend,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        approved: false
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  },

  async getTrends(niche?: string) {
    const path = "trends";
    try {
      let q = query(
        collection(db, path), 
        where("userId", "==", auth.currentUser?.uid)
      );
      if (niche) {
        q = query(q, where("niche", "==", niche));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort in-memory to avoid composite index requirement
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
  },

  async approveTrend(id: string) {
    const path = `trends/${id}`;
    try {
      await updateDoc(doc(db, "trends", id), { approved: true });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  // Keywords
  async addKeyword(keyword: any) {
    const path = "keywords";
    try {
      return await addDoc(collection(db, path), {
        ...keyword,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        selected: false
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  },

  async getKeywords(trendId: string) {
    const path = "keywords";
    try {
      const q = query(
        collection(db, path), 
        where("userId", "==", auth.currentUser?.uid),
        where("trendId", "==", trendId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort in-memory
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
  },

  async selectKeyword(id: string) {
    const path = `keywords/${id}`;
    try {
      await updateDoc(doc(db, "keywords", id), { selected: true });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  // Products
  async addProduct(product: any) {
    const path = "products";
    try {
      return await addDoc(collection(db, path), {
        ...product,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        selected: false
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  },

  async getProducts(keywordId: string) {
    const path = "products";
    try {
      const q = query(
        collection(db, path), 
        where("userId", "==", auth.currentUser?.uid),
        where("keywordId", "==", keywordId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort in-memory
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
  },

  async selectProduct(id: string) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, "products", id), { selected: true });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  async updateProduct(id: string, data: any) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, "products", id), data);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  // Articles
  async addArticle(article: any) {
    const path = "articles";
    try {
      return await addDoc(collection(db, path), {
        ...article,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        approved: false,
        published: false
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  },

  async getArticlesByKeyword(keywordId: string) {
    const path = "articles";
    try {
      const q = query(
        collection(db, path), 
        where("userId", "==", auth.currentUser?.uid),
        where("keywordId", "==", keywordId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
  },

  async updateArticle(id: string, data: any) {
    const path = `articles/${id}`;
    try {
      await updateDoc(doc(db, "articles", id), data);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  // Social Posts
  async addSocialPost(post: any) {
    const path = "social_posts";
    try {
      return await addDoc(collection(db, path), {
        ...post,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  },

  async getSocialPosts(articleId: string) {
    const path = "social_posts";
    try {
      const q = query(
        collection(db, path), 
        where("userId", "==", auth.currentUser?.uid),
        where("articleId", "==", articleId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { handleFirestoreError(e, OperationType.LIST, path); }
  },

  async updateSocialPost(id: string, data: any) {
    const path = `social_posts/${id}`;
    try {
      await updateDoc(doc(db, "social_posts", id), data);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  },

  async getGlobalStats() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return null;

      const collections = ["trends", "keywords", "products", "articles", "social_posts"];
      const stats: any = {};

      for (const col of collections) {
        const q = query(collection(db, col), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        stats[col] = snapshot.size;
      }

      return stats;
    } catch (e) {
      console.error("Error fetching stats:", e);
      return null;
    }
  }
};
