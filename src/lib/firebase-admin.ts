import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

/**
 * Identifiant du projet Firebase, résolu explicitement.
 *
 * En production (App Hosting, Cloud Run) il est injecté dans l'environnement
 * et `initializeApp()` sans argument suffit. En local, rien ne l'injecte : le
 * SDK Admin échouait alors sur « Unable to detect a Project Id », et CHAQUE
 * route API répondait 401 « Session invalide » — un message trompeur, puisque
 * la session du visiteur était parfaitement valide.
 *
 * On retombe donc sur la configuration cliente, qui porte le même projet.
 */
const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  firebaseConfig.projectId;

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin, projectId };
