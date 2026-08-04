import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('local_jobs')
      .orderBy('createdAt', 'desc')
      .get();
    
    const jobs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    return NextResponse.json({ jobs });
  } catch (err: any) {
    console.error('API local jobs fetch error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.jobs && Array.isArray(body.jobs)) {
      // Batch creation
      const batch = adminDb.batch();
      const colRef = adminDb.collection('local_jobs');
      
      body.jobs.forEach((job: any) => {
        const docRef = colRef.doc();
        batch.set(docRef, {
          ...job,
          createdAt: new Date(),
        });
      });
      
      await batch.commit();
      return NextResponse.json({ success: true });
    } else {
      // Single creation
      const docRef = await adminDb.collection('local_jobs').add({
        ...body,
        createdAt: new Date(),
      });
      return NextResponse.json({ id: docRef.id });
    }
  } catch (err: any) {
    console.error('API local jobs save error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
