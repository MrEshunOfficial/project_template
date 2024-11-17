// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/authentication/authModel';
import { connect } from '@/dbconfigue/dbConfigue';

// Create a custom type for errors that might include a 'code' property
interface MongoError extends Error {
  code?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save hook
    });

    // Save user
    await user.save();

    // Log successful registration
    console.log('User registered successfully:', {
      id: user._id,
      email: user.email,
      name: user.name
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Registration error:', error);
  
    // Type guard to check if 'error' has a 'code' property
    if (typeof error === 'object' && error !== null && 'code' in error && (error as MongoError).code === 11000) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
  
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}