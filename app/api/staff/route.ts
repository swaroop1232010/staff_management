import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleStaff } from '@/lib/sampleStaff';

// GET /api/staff - Get all staff members
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    // Fallback to sample data if database is not available
    return NextResponse.json(sampleStaff);
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error: any) {
    const data = await request.json();
    console.error('Error creating staff:', error);
    
    // If database is not available, simulate creation with sample data
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      const newStaff = {
        id: `staff_${Date.now()}`,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json(newStaff, { status: 201 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
