import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    await dbConnect();
    
    const existingAdmin = await User.findOne({ email: 'admin@tournify.com' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' }, { status: 200 });
    }

    const passwordHash = await bcrypt.hash('admin123', 12);
    
    await User.create({
      name: 'Admin',
      email: 'admin@tournify.com',
      passwordHash,
      role: 'admin',
    });

    return NextResponse.json({ message: 'Admin user created successfully. Email: admin@tournify.com, Password: admin123' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
