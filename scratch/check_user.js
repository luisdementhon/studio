
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'studio-6613366678-b4207'
  });
}
const db = admin.firestore();

async function checkUser() {
  const bridgeUuid = 'ebe86803-12eb-4341-820f-fca1f6c0a991';
  console.log(`Checking for bridgeUserUuid: ${bridgeUuid}`);
  
  const snapshot = await db.collection('users').where('bridgeUserUuid', '==', bridgeUuid).get();
  
  if (snapshot.empty) {
    console.log('No user found with this Bridge UUID.');
  } else {
    snapshot.forEach(doc => {
      console.log(`User Found: ${doc.id}`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
    
    // Check for donations
    const userId = snapshot.docs[0].id;
    const donations = await db.collection('users').doc(userId).collection('donations').get();
    console.log(`Found ${donations.size} donations for this user.`);
  }
  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
