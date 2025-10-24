// verify coupon

import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const {userId, has} = getAuth(request);
        const {code} = await request.json();

        // FIX 1: Added check to prevent crash if 'code' is not provided in the request.
        if (!code) {
            return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
        }

        // FIX 2: Changed 'findUnique' to 'findFirst'. 'findUnique' can only query on a single unique field.
        // 'findFirst' is required to query by both 'code' and 'expiresAt'.
        const coupon = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                expiresAt: { gt: new Date() }
            }
        })

        if (!coupon) {
            return NextResponse.json({error: "Coupon not found or expired"}, {status: 404});
        }

        // FIX 3: Added check for 'userId'. The original code would not work correctly
        // for logged-out users trying to validate a 'forNewUser' coupon.
        if (coupon.forNewUser) {
            if (!userId) {
                return NextResponse.json({ error: "You must be logged in to use this coupon." }, { status: 401 });
            }
            const userorders = await prisma.order.findMany({where: {userId}});
            if (userorders.length>0) {
                return NextResponse.json({error: "Coupon valid for new users only"}, {status: 400});
            }
        }

        if (coupon.forMember) {
            const hasPlusPlan = has({plan:'plus'})
            if (!hasPlusPlan) {
                return NextResponse.json({error: "Coupon valid for Plus members only"}, {status: 400});
            }
        }

        return NextResponse.json({coupon}, {status: 200});

    } catch (error) {
        console.error(error);
        return NextResponse.json ({error:error.code || error.message}, {status:400})
    }
}