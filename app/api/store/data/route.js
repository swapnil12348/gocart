import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
// get store infor and products



export async function GET(request) {
    try {
        //get store usernmae from query params
        const {searchParams} = new URL(request.url);
        const username = searchParams.get('username').toLowerCase();

        if(!username){
            return NextResponse.json({error: 'missing details: username'}, {status:400});
        }

        // get store info and in stock products with ratings


        const store = await prisma.store.findUnique({
            where: {username, isActive: true},
            include:{product: {include: {rating: true}}}
        })

        if(!store){
            return NextResponse.json({error: 'store not found'}, {status:400});
        }

        return NextResponse.json({store})

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status:400});
    }
}