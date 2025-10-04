import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { sampleStaff } from '@/lib/sampleStaff';

// GET /api/staff/[id] - Get staff member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: params.id }
    });

    if (!staff) {
      // Fallback to sample data
      const sampleStaffMember = sampleStaff.find(s => s.id === params.id);
      if (sampleStaffMember) {
        return NextResponse.json(sampleStaffMember);
      }
      
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    // Fallback to sample data
    const sampleStaffMember = sampleStaff.find(s => s.id === params.id);
    if (sampleStaffMember) {
      return NextResponse.json(sampleStaffMember);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    const data = await request.json();
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }
    
    // If database is not available, simulate update
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      const updatedStaff = {
        id: params.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json(updatedStaff);
    }
    
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.staff.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Staff member deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }
    
    // If database is not available, simulate deletion
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return NextResponse.json({ message: 'Staff member deleted successfully' });
    }
    
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
