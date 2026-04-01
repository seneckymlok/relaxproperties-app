import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE = 'admin_session';
const SESSION_TOKEN = 'authenticated';

export async function POST(request: NextRequest) {
    if (!ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const { password } = await request.json();

        if (!password || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: 'Nesprávne heslo' },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, SESSION_TOKEN, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ success: true });
}

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    if (session?.value === SESSION_TOKEN) {
        return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
}
