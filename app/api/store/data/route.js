import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const usernameParam = searchParams.get('username');
        if (!usernameParam) {
            return NextResponse.json({ error: 'Missing required parameter: username' }, { status: 400 });
        }
        const username = usernameParam.toLowerCase();

        const store = await prisma.store.findFirst({
            where: {
                username: username,
                isActive: true
            },
            include: {
                // FIX: Changed 'product' to 'Product' to match the schema
                Product: { 
                    where: { inStock: true },
                    include: {
                        rating: true
                    }
                }
            }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found or is inactive' }, { status: 404 });
        }

        return NextResponse.json({ store }, { status: 200 });

    } catch (error) {
        console.error("API Error in /api/store/data:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}